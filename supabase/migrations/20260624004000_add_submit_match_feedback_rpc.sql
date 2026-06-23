CREATE OR REPLACE FUNCTION public.submit_match_feedback(class_id uuid, choice text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _class_id uuid;
  _choice text;
  _uid uuid := auth.uid();
  _updated jsonb;
BEGIN
  _class_id := $1;
  _choice := btrim(coalesce($2, ''));

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF _choice NOT IN ('Useful', 'Unsure', 'Not useful') THEN
    RAISE EXCEPTION 'invalid_feedback_choice' USING ERRCODE = '22023';
  END IF;

  UPDATE public.match_results AS mr
  SET result_data = jsonb_set(mr.result_data, '{feedback_after_week}', to_jsonb(_choice), true)
  WHERE mr.class_id = _class_id
    AND mr.student_id = _uid
  RETURNING mr.result_data INTO _updated;

  IF _updated IS NULL THEN
    RAISE EXCEPTION 'match_feedback_not_found' USING ERRCODE = 'P0002';
  END IF;

  RETURN _updated;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_match_feedback(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_match_feedback(uuid, text) TO authenticated;
