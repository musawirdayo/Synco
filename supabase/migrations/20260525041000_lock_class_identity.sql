-- Identity hardening:
-- - one normalized identifier can only join a class once
-- - students must join through join_class_by_code; direct membership inserts are blocked
-- - survey responses require class membership

CREATE OR REPLACE FUNCTION public.normalize_student_identifier(_identifier text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT NULLIF(lower(regexp_replace(btrim(coalesce(_identifier, '')), '\s+', ' ', 'g')), '');
$$;

DO $$
DECLARE
  _has_member_duplicates boolean;
  _has_roster_duplicates boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.class_members
    WHERE public.normalize_student_identifier(identifier) IS NOT NULL
    GROUP BY class_id, public.normalize_student_identifier(identifier)
    HAVING count(*) > 1
  ) INTO _has_member_duplicates;

  SELECT EXISTS (
    SELECT 1
    FROM public.roster_entries
    GROUP BY class_id, public.normalize_student_identifier(identifier)
    HAVING count(*) > 1
  ) INTO _has_roster_duplicates;

  IF _has_member_duplicates THEN
    RAISE NOTICE 'Skipping class_members normalized identifier index because duplicates already exist. Remove duplicate memberships, then create class_members_class_identifier_normalized_key.';
  ELSE
    UPDATE public.class_members
    SET identifier = public.normalize_student_identifier(identifier)
    WHERE identifier IS NOT NULL
      AND identifier IS DISTINCT FROM public.normalize_student_identifier(identifier);

    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS class_members_class_identifier_normalized_key ON public.class_members (class_id, public.normalize_student_identifier(identifier)) WHERE public.normalize_student_identifier(identifier) IS NOT NULL';
  END IF;

  IF _has_roster_duplicates THEN
    RAISE NOTICE 'Skipping roster_entries normalized identifier index because duplicates already exist. Remove duplicate roster entries, then create roster_entries_class_identifier_normalized_key.';
  ELSE
    UPDATE public.roster_entries
    SET identifier = public.normalize_student_identifier(identifier)
    WHERE identifier IS DISTINCT FROM public.normalize_student_identifier(identifier);

    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS roster_entries_class_identifier_normalized_key ON public.roster_entries (class_id, public.normalize_student_identifier(identifier))';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.prevent_duplicate_class_member_identifier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _normalized_identifier text := public.normalize_student_identifier(NEW.identifier);
BEGIN
  IF _normalized_identifier IS NULL THEN
    RAISE EXCEPTION 'identifier_required' USING ERRCODE = 'P0001';
  END IF;

  NEW.identifier := _normalized_identifier;

  IF EXISTS (
    SELECT 1
    FROM public.class_members
    WHERE class_id = NEW.class_id
      AND public.normalize_student_identifier(identifier) = _normalized_identifier
      AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'identifier_taken' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS class_members_prevent_duplicate_identifier ON public.class_members;
CREATE TRIGGER class_members_prevent_duplicate_identifier
BEFORE INSERT OR UPDATE OF class_id, identifier
ON public.class_members
FOR EACH ROW
EXECUTE FUNCTION public.prevent_duplicate_class_member_identifier();

CREATE OR REPLACE FUNCTION public.prevent_duplicate_roster_identifier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _normalized_identifier text := public.normalize_student_identifier(NEW.identifier);
BEGIN
  IF _normalized_identifier IS NULL THEN
    RAISE EXCEPTION 'identifier_required' USING ERRCODE = 'P0001';
  END IF;

  NEW.identifier := _normalized_identifier;

  IF EXISTS (
    SELECT 1
    FROM public.roster_entries
    WHERE class_id = NEW.class_id
      AND public.normalize_student_identifier(identifier) = _normalized_identifier
      AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'identifier_taken' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roster_entries_prevent_duplicate_identifier ON public.roster_entries;
CREATE TRIGGER roster_entries_prevent_duplicate_identifier
BEFORE INSERT OR UPDATE OF class_id, identifier
ON public.roster_entries
FOR EACH ROW
EXECUTE FUNCTION public.prevent_duplicate_roster_identifier();

DROP POLICY IF EXISTS "student self insert" ON public.class_members;

DROP POLICY IF EXISTS "student own response" ON public.survey_responses;
CREATE POLICY "student own response"
ON public.survey_responses
FOR ALL
TO authenticated
USING (
  auth.uid() = student_id
  AND public.is_class_member(class_id, auth.uid())
)
WITH CHECK (
  auth.uid() = student_id
  AND public.is_class_member(class_id, auth.uid())
);

DROP FUNCTION IF EXISTS public.lookup_class_by_code(text);
CREATE FUNCTION public.lookup_class_by_code(_code text)
RETURNS TABLE(identifier_type text, roster_lock_enabled boolean, requires_identifier boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT identifier_type, roster_lock_enabled, true AS requires_identifier
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
  _normalized_identifier text := public.normalize_student_identifier(_identifier);
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

  IF _normalized_identifier IS NULL THEN
    RAISE EXCEPTION 'identifier_required' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO _cls FROM public.classes WHERE invite_code = upper(_code) LIMIT 1;
  IF _cls.id IS NULL THEN
    RAISE EXCEPTION 'invalid_code' USING ERRCODE = 'P0002';
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
      AND public.normalize_student_identifier(identifier) = _normalized_identifier
      AND student_id <> _uid
  ) THEN
    RAISE EXCEPTION 'identifier_taken' USING ERRCODE = 'P0001';
  END IF;

  IF _cls.roster_lock_enabled THEN
    SELECT * INTO _entry FROM public.roster_entries
    WHERE class_id = _cls.id
      AND public.normalize_student_identifier(identifier) = _normalized_identifier
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
