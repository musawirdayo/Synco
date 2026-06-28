-- Make demo classes useful for a real trial run.
-- Earlier demo data filled all 6 seats with fake completed students. This
-- version seeds 5 completed classmates and leaves 1 open seat so the signed-in
-- lead can use the invite link, join as the sixth member, complete the survey,
-- publish, and see their own results.
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
    'e0000000-0000-0000-0000-000000000005'::uuid
  ];
  _student_names text[] := ARRAY[
    'Alex Mercer', 'Sarah Connor', 'Bruce Wayne', 'Diana Prince', 'Clark Kent'
  ];
  _student_emails text[] := ARRAY[
    'alex.mercer@demo.com', 'sarah.connor@demo.com', 'bruce.wayne@demo.com',
    'diana.prince@demo.com', 'clark.kent@demo.com'
  ];
  _student_idents text[] := ARRAY[
    'ROLL-001', 'ROLL-002', 'ROLL-003', 'ROLL-004', 'ROLL-005'
  ];
  _answers jsonb[] := ARRAY[
    '{"q1":4,"q2":2,"q3":4,"q4":4,"q5":4,"q6":3,"q7":5,"q8":5,"q9":4,"q10":3,"q11":4,"q12":3,"q13":2,"q14":4,"q15":5,"q16":5,"q17":4,"q18":4,"q19":4,"q20":4,"q21":4,"q22":4,"availability":["Mon afternoon","Wed evening","Sat morning"],"topics":["Programming","Data analysis"],"strengths":["Programming","Presentation"],"weakAreas":["Research"],"studyStyle":"Project sprints","seriousness":4,"targetGrade":"A range","projectOutcome":"Strong grade","communicationPreference":"WhatsApp/text","meetingMode":"Hybrid","privacyPreference":"Show my name in results"}'::jsonb,
    '{"q1":2,"q2":2,"q3":1,"q4":2,"q5":2,"q6":4,"q7":3,"q8":2,"q9":2,"q10":1,"q11":2,"q12":4,"q13":2,"q14":4,"q15":5,"q16":5,"q17":3,"q18":4,"q19":4,"q20":4,"q21":4,"q22":4,"availability":["Mon afternoon","Thu evening","Sat morning"],"topics":["Research","Writing"],"strengths":["Research","Writing"],"weakAreas":["Programming"],"studyStyle":"Review notes","seriousness":5,"targetGrade":"A range","projectOutcome":"Excellent result","communicationPreference":"WhatsApp/text","meetingMode":"Online","privacyPreference":"Show my name in results"}'::jsonb,
    '{"q1":2,"q2":4,"q3":2,"q4":1,"q5":2,"q6":2,"q7":2,"q8":2,"q9":1,"q10":2,"q11":2,"q12":2,"q13":2,"q14":3,"q15":5,"q16":5,"q17":2,"q18":4,"q19":3,"q20":4,"q21":3,"q22":4,"availability":["Tue evening","Wed evening","Sun evening"],"topics":["Programming","Calculus"],"strengths":["Data analysis","Programming"],"weakAreas":["Presentation"],"studyStyle":"Quiet co-working","seriousness":4,"targetGrade":"B or better","projectOutcome":"Solid result","communicationPreference":"Email","meetingMode":"Online","privacyPreference":"Show name but keep reasons general"}'::jsonb,
    '{"q1":1,"q2":2,"q3":2,"q4":3,"q5":3,"q6":4,"q7":4,"q8":2,"q9":3,"q10":2,"q11":1,"q12":4,"q13":2,"q14":4,"q15":5,"q16":5,"q17":4,"q18":4,"q19":4,"q20":4,"q21":4,"q22":4,"availability":["Mon morning","Wed afternoon","Fri afternoon"],"topics":["Design","Presentation"],"strengths":["Presentation","Quality checker"],"weakAreas":["Data analysis"],"studyStyle":"Explain and teach","seriousness":4,"targetGrade":"A range","projectOutcome":"Strong grade","communicationPreference":"In-person after class","meetingMode":"In person","privacyPreference":"Show my name in results"}'::jsonb,
    '{"q1":3,"q2":3,"q3":3,"q4":3,"q5":3,"q6":3,"q7":3,"q8":3,"q9":3,"q10":3,"q11":3,"q12":3,"q13":3,"q14":4,"q15":5,"q16":5,"q17":3,"q18":3,"q19":3,"q20":4,"q21":3,"q22":3,"availability":["Thu evening","Sat afternoon","Sun evening"],"topics":["Research","Design"],"strengths":["Design","Research"],"weakAreas":["Writing"],"studyStyle":"Practice problems","seriousness":3,"targetGrade":"B or better","projectOutcome":"Solid result","communicationPreference":"Discord/Slack","meetingMode":"Hybrid","privacyPreference":"Show my name in results"}'::jsonb
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
    institution,
    expected_count,
    invite_code,
    lead_id,
    is_published,
    roster_lock_enabled,
    identifier_type,
    identifier_prefix,
    identifier_suffix_digits,
    team_size
  )
  VALUES (
    'Project Teams Demo',
    'Try the student survey with roll ending 006',
    6,
    _invite_code,
    _lead_id,
    false,
    false,
    'roll',
    'ROLL',
    3,
    3
  )
  RETURNING id INTO _cls_id;

  FOR i IN 1..5 LOOP
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
        submitted_at = EXCLUDED.submitted_at,
        updated_at = now();
  END LOOP;

  RETURN _cls_id;
END;
$$;

REVOKE ALL ON FUNCTION public.setup_demo_class(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_demo_class(uuid) TO authenticated;
