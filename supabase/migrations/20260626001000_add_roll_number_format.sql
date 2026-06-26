-- Store optional roll-number format rules on each class and enforce them
-- inside roster locking / join RPCs. This lets a lead set a prefix like
-- SP25-BCS and a numeric ending length, while students can enter only 006.

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS identifier_prefix text,
ADD COLUMN IF NOT EXISTS identifier_suffix_digits integer;

ALTER TABLE public.classes
DROP CONSTRAINT IF EXISTS classes_identifier_suffix_digits_range;

ALTER TABLE public.classes
ADD CONSTRAINT classes_identifier_suffix_digits_range
CHECK (
  identifier_suffix_digits IS NULL
  OR identifier_suffix_digits BETWEEN 1 AND 12
);

CREATE OR REPLACE FUNCTION public.normalize_student_identifier(_identifier text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT NULLIF(
    lower(
      regexp_replace(
        regexp_replace(btrim(coalesce(_identifier, '')), '\s*-\s*', '-', 'g'),
        '\s+',
        ' ',
        'g'
      )
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.normalize_roll_prefix(_prefix text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(public.normalize_student_identifier(_prefix), '\s+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.normalize_class_identifier(_class_id uuid, _identifier text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _identifier_type text;
  _prefix text;
  _suffix_digits integer;
  _base text := public.normalize_student_identifier(_identifier);
  _compact text;
  _suffix text;
BEGIN
  IF _base IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT
    coalesce(identifier_type, 'roll'),
    public.normalize_roll_prefix(identifier_prefix),
    identifier_suffix_digits
  INTO _identifier_type, _prefix, _suffix_digits
  FROM public.classes
  WHERE id = _class_id;

  IF _identifier_type IS DISTINCT FROM 'roll' THEN
    RETURN _base;
  END IF;

  IF _prefix IS NULL AND _suffix_digits IS NULL THEN
    RETURN _base;
  END IF;

  _compact := regexp_replace(_base, '[^a-z0-9]+', '', 'g');
  _suffix := substring(_compact from '([0-9]+)$');

  IF _suffix IS NULL THEN
    RETURN _base;
  END IF;

  IF _suffix_digits IS NOT NULL AND length(_suffix) < _suffix_digits THEN
    _suffix := lpad(_suffix, _suffix_digits, '0');
  END IF;

  IF _prefix IS NOT NULL THEN
    RETURN _prefix || '-' || _suffix;
  END IF;

  RETURN _suffix;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_duplicate_class_member_identifier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _normalized_identifier text := public.normalize_class_identifier(NEW.class_id, NEW.identifier);
BEGIN
  IF _normalized_identifier IS NULL THEN
    RAISE EXCEPTION 'identifier_required' USING ERRCODE = 'P0001';
  END IF;

  NEW.identifier := _normalized_identifier;

  IF EXISTS (
    SELECT 1
    FROM public.class_members
    WHERE class_id = NEW.class_id
      AND public.normalize_class_identifier(class_id, identifier) = _normalized_identifier
      AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'identifier_taken' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_duplicate_roster_identifier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _normalized_identifier text := public.normalize_class_identifier(NEW.class_id, NEW.identifier);
BEGIN
  IF _normalized_identifier IS NULL THEN
    RAISE EXCEPTION 'identifier_required' USING ERRCODE = 'P0001';
  END IF;

  NEW.identifier := _normalized_identifier;

  IF EXISTS (
    SELECT 1
    FROM public.roster_entries
    WHERE class_id = NEW.class_id
      AND public.normalize_class_identifier(class_id, identifier) = _normalized_identifier
      AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'identifier_taken' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.lookup_class_by_code(text);
CREATE FUNCTION public.lookup_class_by_code(_code text)
RETURNS TABLE(
  identifier_type text,
  roster_lock_enabled boolean,
  requires_identifier boolean,
  identifier_prefix text,
  identifier_suffix_digits integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    identifier_type,
    roster_lock_enabled,
    true AS requires_identifier,
    identifier_prefix,
    identifier_suffix_digits
  FROM public.classes
  WHERE invite_code = upper(_code)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_class_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_class_by_code(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_class_by_code(
  _code text,
  _display_name text,
  _identifier text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _cls public.classes%ROWTYPE;
  _existing public.class_members%ROWTYPE;
  _entry public.roster_entries%ROWTYPE;
  _resp_completed boolean;
  _normalized_identifier text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF _display_name IS NULL OR length(btrim(_display_name)) = 0 THEN
    RAISE EXCEPTION 'Display name is required' USING ERRCODE = '22023';
  END IF;
  IF length(_display_name) > 120 THEN
    RAISE EXCEPTION 'Display name too long' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO _cls FROM public.classes WHERE invite_code = upper(_code) LIMIT 1;
  IF _cls.id IS NULL THEN
    RAISE EXCEPTION 'invalid_code' USING ERRCODE = 'P0002';
  END IF;

  _normalized_identifier := public.normalize_class_identifier(_cls.id, _identifier);
  IF _normalized_identifier IS NULL THEN
    RAISE EXCEPTION 'identifier_required' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO _existing FROM public.class_members
  WHERE class_id = _cls.id AND student_id = _uid LIMIT 1;
  IF _existing.id IS NOT NULL THEN
    SELECT completed INTO _resp_completed FROM public.survey_responses
    WHERE class_id = _cls.id AND student_id = _uid LIMIT 1;
    RETURN jsonb_build_object(
      'class_id', _cls.id,
      'already_member', true,
      'survey_completed', coalesce(_resp_completed, false)
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.class_members
    WHERE class_id = _cls.id
      AND public.normalize_class_identifier(class_id, identifier) = _normalized_identifier
      AND student_id <> _uid
  ) THEN
    RAISE EXCEPTION 'identifier_taken' USING ERRCODE = 'P0001';
  END IF;

  IF _cls.roster_lock_enabled THEN
    SELECT * INTO _entry FROM public.roster_entries
    WHERE class_id = _cls.id
      AND public.normalize_class_identifier(class_id, identifier) = _normalized_identifier
    LIMIT 1
    FOR UPDATE;

    IF _entry.id IS NULL THEN
      RAISE EXCEPTION 'not_on_roster' USING ERRCODE = 'P0001';
    END IF;
    IF _entry.claimed_by IS NOT NULL AND _entry.claimed_by <> _uid THEN
      RAISE EXCEPTION 'roster_taken' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.roster_entries
    SET claimed_by = _uid, claimed_at = now()
    WHERE id = _entry.id;
  END IF;

  BEGIN
    INSERT INTO public.class_members (class_id, student_id, display_name, identifier)
    VALUES (_cls.id, _uid, btrim(_display_name), _normalized_identifier);
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'identifier_taken' USING ERRCODE = 'P0001';
  END;

  RETURN jsonb_build_object('class_id', _cls.id, 'already_member', false, 'survey_completed', false);
END;
$$;

REVOKE ALL ON FUNCTION public.join_class_by_code(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(text, text, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.normalize_class_identifier(uuid, text) TO authenticated;
