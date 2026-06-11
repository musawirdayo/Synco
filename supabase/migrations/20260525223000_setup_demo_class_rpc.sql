-- Create setup_demo_class RPC to allow leads to spin up a fully populated test class in one click
CREATE OR REPLACE FUNCTION public.setup_demo_class(_lead_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cls_id uuid;
  _student_ids uuid[] := ARRAY[
    'e0000000-0000-0000-0000-000000000001'::uuid, -- Alex Mercer (Fast Starter)
    'e0000000-0000-0000-0000-000000000002'::uuid, -- Sarah Connor (Reliable Finisher)
    'e0000000-0000-0000-0000-000000000003'::uuid, -- Bruce Wayne (Deep Thinker)
    'e0000000-0000-0000-0000-000000000004'::uuid, -- Diana Prince (Steady Organizer)
    'e0000000-0000-0000-0000-000000000005'::uuid, -- Clark Kent (Adaptive Generalist)
    'e0000000-0000-0000-0000-000000000006'::uuid  -- Tony Stark (Concept Explainer)
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
  -- Define survey answers matching their distinct archetypes
  _answers jsonb[] := ARRAY[
    -- Alex Mercer (Fast Starter): high initiative (q7=5), high fast-start (q8=5)
    '{"q1":4,"q2":2,"q3":4,"q4":4,"q5":4,"q6":3,"q7":5,"q8":5,"q9":4,"q10":3,"q11":4,"q12":3,"q13":2,"q14":4,"q15":5,"q16":5,"q17":4,"q18":4,"q19":4,"q20":4,"q21":4,"q22":4}'::jsonb,
    
    -- Sarah Connor (Reliable Finisher): low deadline-buffer (q3=1 => early), low q10 (1 => consistent calendar)
    '{"q1":2,"q2":2,"q3":1,"q4":2,"q5":2,"q6":4,"q7":3,"q8":2,"q9":2,"q10":1,"q11":2,"q12":4,"q13":2,"q14":4,"q15":5,"q16":5,"q17":3,"q18":4,"q19":4,"q20":4,"q21":4,"q22":4}'::jsonb,
    
    -- Bruce Wayne (Deep Thinker): low q9 (2 => deep focus), low q4 (1 => quiet space required)
    '{"q1":2,"q2":4,"q3":2,"q4":1,"q5":2,"q6":2,"q7":2,"q8":2,"q9":1,"q10":2,"q11":2,"q12":2,"q13":2,"q14":3,"q15":5,"q16":5,"q17":2,"q18":4,"q19":3,"q20":4,"q21":3,"q22":4}'::jsonb,
    
    -- Diana Prince (Steady Organizer): low q1 (2 => tasks assigned), low q11 (2 => clear roles)
    '{"q1":1,"q2":2,"q3":2,"q4":3,"q5":3,"q6":4,"q7":4,"q8":2,"q9":3,"q10":2,"q11":1,"q12":4,"q13":2,"q14":4,"q15":5,"q16":5,"q17":4,"q18":4,"q19":4,"q20":4,"q21":4,"q22":4}'::jsonb,
    
    -- Clark Kent (Adaptive Generalist): moderate mid-scores (3)
    '{"q1":3,"q2":3,"q3":3,"q4":3,"q5":3,"q6":3,"q7":3,"q8":3,"q9":3,"q10":3,"q11":3,"q12":3,"q13":3,"q14":4,"q15":5,"q16":5,"q17":3,"q18":3,"q19":3,"q20":4,"q21":3,"q22":3}'::jsonb,
    
    -- Tony Stark (Concept Explainer): high q6 (5 => enjoys teaching), low q5 (1 => depth before breadth)
    '{"q1":4,"q2":2,"q3":3,"q4":4,"q5":1,"q6":5,"q7":4,"q8":3,"q9":2,"q10":4,"q11":4,"q12":4,"q13":2,"q14":4,"q15":5,"q16":5,"q17":5,"q18":5,"q19":5,"q20":4,"q21":4,"q22":4}'::jsonb
  ];
BEGIN
  -- 1. Delete existing demo class (invite code 'DEMO12')
  DELETE FROM public.classes WHERE invite_code = 'DEMO12';

  -- 2. Create the brand new demo class
  INSERT INTO public.classes (name, expected_count, invite_code, lead_id, is_published, roster_lock_enabled)
  VALUES ('Advanced Software Engineering (Demo)', 6, 'DEMO12', _lead_id, false, false)
  RETURNING id INTO _cls_id;

  -- 3. Ensure demo students exist in auth.users and profiles
  FOR i IN 1..6 LOOP
    -- Insert auth.user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data)
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
    SET email = EXCLUDED.email, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- Ensure profiles row exists (ON CONFLICT DO NOTHING because of auto-trigger)
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (_student_ids[i], _student_names[i], 'student')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

    -- 4. Add them to class_members
    INSERT INTO public.class_members (class_id, student_id, display_name, identifier)
    VALUES (_cls_id, _student_ids[i], _student_names[i], _student_idents[i])
    ON CONFLICT DO NOTHING;

    -- 5. Seed survey responses
    INSERT INTO public.survey_responses (class_id, student_id, answers, completed, submitted_at)
    VALUES (_cls_id, _student_ids[i], _answers[i], true, now() - (interval '1 hour' * i))
    ON CONFLICT (class_id, student_id) DO UPDATE
    SET answers = EXCLUDED.answers, completed = EXCLUDED.completed, submitted_at = EXCLUDED.submitted_at;
  END LOOP;

  RETURN _cls_id;
END;
$$;

REVOKE ALL ON FUNCTION public.setup_demo_class(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_demo_class(uuid) TO authenticated;
