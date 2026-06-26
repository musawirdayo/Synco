-- Match feedback is platform product feedback, not lead-facing class feedback.
-- Store it separately from match_results so class leads cannot read it through
-- their existing lead read policy on match_results.

CREATE TABLE IF NOT EXISTS public.platform_match_feedback (
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  choice text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id),
  CONSTRAINT platform_match_feedback_choice_check
    CHECK (choice IN ('Useful', 'Unsure', 'Not useful'))
);

ALTER TABLE public.platform_match_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students read own platform feedback" ON public.platform_match_feedback;
CREATE POLICY "students read own platform feedback"
ON public.platform_match_feedback
FOR SELECT
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "platform admins read platform feedback" ON public.platform_match_feedback;
CREATE POLICY "platform admins read platform feedback"
ON public.platform_match_feedback
FOR SELECT
USING (public.admin_has_platform_access(auth.uid()));

INSERT INTO public.platform_match_feedback (class_id, student_id, choice, created_at, updated_at)
SELECT
  class_id,
  student_id,
  result_data ->> 'feedback_after_week',
  generated_at,
  now()
FROM public.match_results
WHERE result_data ->> 'feedback_after_week' IN ('Useful', 'Unsure', 'Not useful')
ON CONFLICT (class_id, student_id) DO UPDATE
SET choice = EXCLUDED.choice,
    updated_at = now();

UPDATE public.match_results
SET result_data = result_data - 'feedback_after_week'
WHERE result_data ? 'feedback_after_week';

CREATE OR REPLACE FUNCTION public.submit_match_feedback(class_id uuid, choice text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _class_id uuid := $1;
  _choice text := btrim(coalesce($2, ''));
  _uid uuid := auth.uid();
  _updated_at timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF _choice NOT IN ('Useful', 'Unsure', 'Not useful') THEN
    RAISE EXCEPTION 'invalid_feedback_choice' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.match_results mr
    WHERE mr.class_id = _class_id
      AND mr.student_id = _uid
  ) THEN
    RAISE EXCEPTION 'match_feedback_not_found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.platform_match_feedback (class_id, student_id, choice)
  VALUES (_class_id, _uid, _choice)
  ON CONFLICT (class_id, student_id) DO UPDATE
  SET choice = EXCLUDED.choice,
      updated_at = now()
  RETURNING updated_at INTO _updated_at;

  RETURN jsonb_build_object(
    'feedback_after_week', _choice,
    'updated_at', _updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_match_feedback(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_match_feedback(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _active_now jsonb;
  _recent_signups jsonb;
  _recent_classes jsonb;
  _recent_submissions jsonb;
  _recent_audit jsonb;
BEGIN
  PERFORM public.admin_assert();

  SELECT coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb)
  INTO _active_now
  FROM (
    SELECT
      ap.user_id,
      au.email,
      p.full_name,
      p.role,
      ap.last_seen_at,
      ap.last_path
    FROM public.admin_presence ap
    LEFT JOIN auth.users au ON au.id = ap.user_id
    LEFT JOIN public.profiles p ON p.id = ap.user_id
    WHERE ap.last_seen_at >= now() - interval '15 minutes'
    ORDER BY ap.last_seen_at DESC
    LIMIT 25
  ) row_data;

  SELECT coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb)
  INTO _recent_signups
  FROM (
    SELECT
      au.id AS user_id,
      au.email,
      au.created_at,
      au.last_sign_in_at,
      p.full_name,
      p.role
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    ORDER BY au.created_at DESC
    LIMIT 12
  ) row_data;

  SELECT coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb)
  INTO _recent_classes
  FROM (
    SELECT
      c.id,
      c.name,
      c.institution,
      c.created_at,
      c.is_published,
      c.invite_code,
      c.expected_count,
      lead_profile.full_name AS lead_name,
      lead_user.email AS lead_email,
      (SELECT count(*) FROM public.class_members cm WHERE cm.class_id = c.id) AS member_count,
      (SELECT count(*) FROM public.survey_responses sr WHERE sr.class_id = c.id AND sr.completed) AS completed_count
    FROM public.classes c
    LEFT JOIN public.profiles lead_profile ON lead_profile.id = c.lead_id
    LEFT JOIN auth.users lead_user ON lead_user.id = c.lead_id
    ORDER BY c.created_at DESC
    LIMIT 12
  ) row_data;

  SELECT coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb)
  INTO _recent_submissions
  FROM (
    SELECT
      sr.class_id,
      c.name AS class_name,
      sr.student_id,
      cm.display_name,
      u.email,
      sr.completed,
      sr.submitted_at,
      sr.updated_at
    FROM public.survey_responses sr
    LEFT JOIN public.classes c ON c.id = sr.class_id
    LEFT JOIN public.class_members cm ON cm.class_id = sr.class_id AND cm.student_id = sr.student_id
    LEFT JOIN auth.users u ON u.id = sr.student_id
    ORDER BY coalesce(sr.submitted_at, sr.updated_at) DESC
    LIMIT 12
  ) row_data;

  SELECT coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb)
  INTO _recent_audit
  FROM (
    SELECT
      aal.id,
      aal.created_at,
      aal.action,
      aal.target_type,
      aal.target_id,
      aal.details,
      actor.email AS actor_email
    FROM public.admin_audit_log aal
    LEFT JOIN auth.users actor ON actor.id = aal.actor_id
    ORDER BY aal.created_at DESC
    LIMIT 12
  ) row_data;

  RETURN jsonb_build_object(
    'generated_at', now(),
    'counts', jsonb_build_object(
      'users', (SELECT count(*) FROM auth.users),
      'profiles', (SELECT count(*) FROM public.profiles),
      'platform_admins', (SELECT count(*) FROM public.platform_admins),
      'classes', (SELECT count(*) FROM public.classes),
      'published_classes', (SELECT count(*) FROM public.classes WHERE is_published),
      'class_members', (SELECT count(*) FROM public.class_members),
      'survey_responses', (SELECT count(*) FROM public.survey_responses),
      'completed_surveys', (SELECT count(*) FROM public.survey_responses WHERE completed),
      'match_results', (SELECT count(*) FROM public.match_results),
      'feedback_total', (SELECT count(*) FROM public.platform_match_feedback),
      'feedback_useful', (SELECT count(*) FROM public.platform_match_feedback WHERE choice = 'Useful'),
      'feedback_unsure', (SELECT count(*) FROM public.platform_match_feedback WHERE choice = 'Unsure'),
      'feedback_not_useful', (SELECT count(*) FROM public.platform_match_feedback WHERE choice = 'Not useful'),
      'active_5m', (SELECT count(*) FROM public.admin_presence WHERE last_seen_at >= now() - interval '5 minutes'),
      'active_15m', (SELECT count(*) FROM public.admin_presence WHERE last_seen_at >= now() - interval '15 minutes'),
      'active_60m', (SELECT count(*) FROM public.admin_presence WHERE last_seen_at >= now() - interval '60 minutes')
    ),
    'active_now', _active_now,
    'recent_signups', _recent_signups,
    'recent_classes', _recent_classes,
    'recent_submissions', _recent_submissions,
    'recent_audit', _recent_audit
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_classes(_query text DEFAULT '', _limit int DEFAULT 100)
RETURNS TABLE (
  class_id uuid,
  name text,
  institution text,
  lead_id uuid,
  lead_name text,
  lead_email text,
  expected_count int,
  invite_code text,
  is_published boolean,
  team_size int,
  created_at timestamptz,
  member_count bigint,
  completed_count bigint,
  result_count bigint,
  feedback_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _needle text := lower(btrim(coalesce(_query, '')));
  _safe_limit int := least(greatest(coalesce(_limit, 100), 1), 200);
BEGIN
  PERFORM public.admin_assert();

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.institution,
    c.lead_id,
    p.full_name,
    au.email::text,
    c.expected_count,
    c.invite_code,
    c.is_published,
    c.team_size,
    c.created_at,
    (SELECT count(*) FROM public.class_members cm WHERE cm.class_id = c.id),
    (SELECT count(*) FROM public.survey_responses sr WHERE sr.class_id = c.id AND sr.completed),
    (SELECT count(*) FROM public.match_results mr WHERE mr.class_id = c.id),
    (SELECT count(*) FROM public.platform_match_feedback pf WHERE pf.class_id = c.id)
  FROM public.classes c
  LEFT JOIN public.profiles p ON p.id = c.lead_id
  LEFT JOIN auth.users au ON au.id = c.lead_id
  WHERE _needle = ''
    OR lower(c.name || ' ' || coalesce(c.institution, '') || ' ' || c.invite_code || ' ' || coalesce(p.full_name, '') || ' ' || coalesce(au.email, '')) LIKE '%' || _needle || '%'
  ORDER BY c.created_at DESC
  LIMIT _safe_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_class_detail(_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_assert();

  RETURN jsonb_build_object(
    'class', (
      SELECT to_jsonb(c)
      FROM public.classes c
      WHERE c.id = _class_id
    ),
    'lead', (
      SELECT jsonb_build_object(
        'id', au.id,
        'email', au.email,
        'full_name', p.full_name,
        'role', p.role
      )
      FROM public.classes c
      LEFT JOIN auth.users au ON au.id = c.lead_id
      LEFT JOIN public.profiles p ON p.id = c.lead_id
      WHERE c.id = _class_id
    ),
    'members', coalesce((
      SELECT jsonb_agg(to_jsonb(row_data) ORDER BY row_data.joined_at DESC)
      FROM (
        SELECT cm.*, au.email, p.full_name, p.role
        FROM public.class_members cm
        LEFT JOIN auth.users au ON au.id = cm.student_id
        LEFT JOIN public.profiles p ON p.id = cm.student_id
        WHERE cm.class_id = _class_id
      ) row_data
    ), '[]'::jsonb),
    'roster_entries', coalesce((
      SELECT jsonb_agg(to_jsonb(re) ORDER BY re.identifier)
      FROM public.roster_entries re
      WHERE re.class_id = _class_id
    ), '[]'::jsonb),
    'survey_responses', coalesce((
      SELECT jsonb_agg(to_jsonb(sr) ORDER BY coalesce(sr.submitted_at, sr.updated_at) DESC)
      FROM public.survey_responses sr
      WHERE sr.class_id = _class_id
    ), '[]'::jsonb),
    'match_results', coalesce((
      SELECT jsonb_agg(to_jsonb(mr) ORDER BY mr.generated_at DESC)
      FROM public.match_results mr
      WHERE mr.class_id = _class_id
    ), '[]'::jsonb),
    'platform_feedback', coalesce((
      SELECT jsonb_agg(to_jsonb(pf) ORDER BY pf.updated_at DESC)
      FROM public.platform_match_feedback pf
      WHERE pf.class_id = _class_id
    ), '[]'::jsonb)
  );
END;
$$;
