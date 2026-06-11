
-- Drop overly permissive policies
DROP POLICY IF EXISTS "auth can read classes" ON public.classes;
DROP POLICY IF EXISTS "auth can read roster" ON public.roster_entries;
DROP POLICY IF EXISTS "auth can claim roster" ON public.roster_entries;

-- Restrict SELECT on classes to lead or member
CREATE POLICY "lead or member read classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  auth.uid() = lead_id
  OR public.is_class_member(id, auth.uid())
);

-- Restrict SELECT on roster_entries to lead or class members
CREATE POLICY "lead or member read roster"
ON public.roster_entries
FOR SELECT
TO authenticated
USING (
  public.is_class_lead(class_id, auth.uid())
  OR public.is_class_member(class_id, auth.uid())
);

-- Lightweight lookup function: returns only non-sensitive metadata needed by join form
CREATE OR REPLACE FUNCTION public.lookup_class_by_code(_code text)
RETURNS TABLE(identifier_type text, roster_lock_enabled boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT identifier_type, roster_lock_enabled
  FROM public.classes
  WHERE invite_code = upper(_code)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_class_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_class_by_code(text) TO authenticated;

-- Secure join function: validates code + roster, claims roster slot, inserts membership atomically
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
  _existing uuid;
  _entry public.roster_entries%ROWTYPE;
  _resp_completed boolean;
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

  -- Already a member?
  SELECT id INTO _existing FROM public.class_members
  WHERE class_id = _cls.id AND student_id = _uid LIMIT 1;
  IF _existing IS NOT NULL THEN
    SELECT completed INTO _resp_completed FROM public.survey_responses
    WHERE class_id = _cls.id AND student_id = _uid LIMIT 1;
    RETURN jsonb_build_object('class_id', _cls.id, 'already_member', true, 'survey_completed', coalesce(_resp_completed, false));
  END IF;

  IF _cls.roster_lock_enabled THEN
    IF _identifier IS NULL OR length(btrim(_identifier)) = 0 THEN
      RAISE EXCEPTION 'identifier_required' USING ERRCODE = 'P0001';
    END IF;
    SELECT * INTO _entry FROM public.roster_entries
    WHERE class_id = _cls.id AND identifier = btrim(_identifier) LIMIT 1;
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

  INSERT INTO public.class_members (class_id, student_id, display_name, identifier)
  VALUES (_cls.id, _uid, btrim(_display_name), NULLIF(btrim(coalesce(_identifier, '')), ''));

  RETURN jsonb_build_object('class_id', _cls.id, 'already_member', false, 'survey_completed', false);
END;
$$;

REVOKE ALL ON FUNCTION public.join_class_by_code(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(text, text, text) TO authenticated;
