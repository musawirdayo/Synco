-- Keep demo setup scoped to the signed-in lead. The previous function already
-- rejected impersonation, but it still reused/deleted the global DEMO12 invite
-- code. This version gives each lead a deterministic demo code and only removes
-- that lead's own prior demo class.
CREATE OR REPLACE FUNCTION public.setup_demo_class(_lead_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cls_id uuid;
  _invite_code text;
  _attempt int := 0;
  _student_ids uuid[] := ARRAY[
    'e0000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000002'::uuid,
    'e0000000-0000-0000-0000-000000000003'::uuid,
    'e0000000-0000-0000-0000-000000000004'::uuid,
    'e0000000-0000-0000-0000-000000000005'::uuid,
    'e0000000-0000-0000-0000-000000000006'::uuid
  ];
  _student_names text[] := ARRAY[
    'Alex Mercer', 'Sarah Connor', 'Bruce Wayne', 'Diana Prince', 'Clark Kent', 'Tony Stark'
  ];
  _student_emails text[] := ARRAY[
    'alex.mercer@demo.com', 'sarah.connor@demo.com', 'bruce.wayne@demo.com',
    'diana.prince@demo.com', 'clark.kent@demo.com', 'tony.stark@demo.com'
  ];
  _student_idents text[] := ARRAY[
    'ROLL-001', 'ROLL-002', 'ROLL-003', 'ROLL-004', 'ROLL-005', 'ROLL-006'
  ];
  _answers jsonb[] := ARRAY[
    '{"q1":4,"q2":2,"q3":4,"q4":4,"q5":4,"q6":3,"q7":5,"q8":5,"q9":4,"q10":3,"q11":4,"q12":3,"q13":2,"q14":4,"q15":5,"q16":5,"q17":4,"q18":4,"q19":4,"q20":4,"q21":4,"q22":4}'::jsonb,
    '{"q1":2,"q2":2,"q3":1,"q4":2,"q5":2,"q6":4,"q7":3,"q8":2,"q9":2,"q10":1,"q11":2,"q12":4,"q13":2,"q14":4,"q15":5,"q16":5,"q17":3,"q18":4,"q19":4,"q20":4,"q21":4,"q22":4}'::jsonb,
    '{"q1":2,"q2":4,"q3":2,"q4":1,"q5":2,"q6":2,"q7":2,"q8":2,"q9":1,"q10":2,"q11":2,"q12":2,"q13":2,"q14":3,"q15":5,"q16":5,"q17":2,"q18":4,"q19":3,"q20":4,"q21":3,"q22":4}'::jsonb,
    '{"q1":1,"q2":2,"q3":2,"q4":3,"q5":3,"q6":4,"q7":4,"q8":2,"q9":3,"q10":2,"q11":1,"q12":4,"q13":2,"q14":4,"q15":5,"q16":5,"q17":4,"q18":4,"q19":4,"q20":4,"q21":4,"q22":4}'::jsonb,
    '{"q1":3,"q2":3,"q3":3,"q4":3,"q5":3,"q6":3,"q7":3,"q8":3,"q9":3,"q10":3,"q11":3,"q12":3,"q13":3,"q14":4,"q15":5,"q16":5,"q17":3,"q18":3,"q19":3,"q20":4,"q21":3,"q22":3}'::jsonb,
    '{"q1":4,"q2":2,"q3":3,"q4":4,"q5":1,"q6":5,"q7":4,"q8":3,"q9":2,"q10":4,"q11":4,"q12":4,"q13":2,"q14":4,"q15":5,"q16":5,"q17":5,"q18":5,"q19":5,"q20":4,"q21":4,"q22":4}'::jsonb
  ];
BEGIN
  IF auth.uid() IS NULL OR _lead_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'setup_demo_class_forbidden' USING ERRCODE = '42501';
  END IF;

  LOOP
    _invite_code := 'D' || upper(substr(md5(_lead_id::text || ':' || _attempt::text), 1, 5));
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.classes
      WHERE invite_code = _invite_code
        AND lead_id <> _lead_id
    );

    _attempt := _attempt + 1;
    IF _attempt > 25 THEN
      RAISE EXCEPTION 'demo_invite_code_unavailable' USING ERRCODE = '23505';
    END IF;
  END LOOP;

  DELETE FROM public.classes
  WHERE lead_id = _lead_id
    AND invite_code IN (_invite_code, 'DEMO12');

  INSERT INTO public.classes (
    name,
    expected_count,
    invite_code,
    lead_id,
    is_published,
    roster_lock_enabled,
    team_size
  )
  VALUES (
    'Advanced Software Engineering (Demo)',
    6,
    _invite_code,
    _lead_id,
    false,
    false,
    3
  )
  RETURNING id INTO _cls_id;

  FOR i IN 1..6 LOOP
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      role,
      aud,
      raw_app_meta_data,
      raw_user_meta_data
    )
    VALUES (
      _student_ids[i],
      _student_emails[i],
      '',
      now(),
      'authenticated',
      'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', _student_names[i])
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (_student_ids[i], _student_names[i], 'student')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    INSERT INTO public.class_members (class_id, student_id, display_name, identifier)
    VALUES (_cls_id, _student_ids[i], _student_names[i], _student_idents[i])
    ON CONFLICT DO NOTHING;

    INSERT INTO public.survey_responses (class_id, student_id, answers, completed, submitted_at)
    VALUES (_cls_id, _student_ids[i], _answers[i], true, now() - (interval '1 hour' * i))
    ON CONFLICT (class_id, student_id) DO UPDATE
    SET answers = EXCLUDED.answers,
        completed = EXCLUDED.completed,
        submitted_at = EXCLUDED.submitted_at;
  END LOOP;

  RETURN _cls_id;
END;
$$;

REVOKE ALL ON FUNCTION public.setup_demo_class(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_demo_class(uuid) TO authenticated;
