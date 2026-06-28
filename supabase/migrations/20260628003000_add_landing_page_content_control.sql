-- Add landing-page control to the admin-editable content system.

alter table public.platform_content
drop constraint if exists platform_content_key_check;

alter table public.platform_content
add constraint platform_content_key_check
check (content_key in ('landing_page', 'privacy_policy', 'terms_of_service', 'contact_page'));

insert into public.platform_content (content_key, title, summary, body)
values (
  'landing_page',
  'Landing page',
  'JSON content used by the public Synco landing page.',
  $content${
  "heroEyebrow": "For class reps organizing project teams",
  "heroTitle": "Create better project teams from one class link.",
  "heroSubtitle": "Synco helps you collect student work habits, form fair teams, and give every classmate a useful result they understand.",
  "heroPrimaryCta": "Create a class",
  "heroSecondaryCta": "See what students get",
  "workflowSteps": ["Create class", "Share link", "Collect surveys", "Publish teams"],
  "audienceBenefits": [
    {
      "label": "Class reps",
      "title": "Stop sorting groups by hand",
      "text": "Create one class link, collect answers, and publish ready-made teams with reasons."
    },
    {
      "label": "Students",
      "title": "A result they actually want",
      "text": "Students get their team, best-fit classmates, risky pairings, and proof in simple language."
    },
    {
      "label": "Project leads",
      "title": "Start with less group drama",
      "text": "Use schedule fit, effort level, strengths, requests, and avoid rules before the project begins."
    }
  ],
  "howIntroEyebrow": "Class workflow",
  "howIntroTitle": "How Synco works",
  "howIntroSubtitle": "A short flow from one invite link to teams your class can actually use.",
  "howSyncoWorks": [
    {
      "title": "Create the class",
      "text": "Set the class name, team size, and join rules before you share anything."
    },
    {
      "title": "Share one link",
      "text": "Students use the invite link to join, answer the survey, and keep results tied to their account."
    },
    {
      "title": "Collect honest answers",
      "text": "Synco checks work habits, free time, goals, strengths, friend requests, and do-not-pair notes."
    },
    {
      "title": "Publish useful results",
      "text": "The class gets teams with reasons, while each student gets a personal match profile."
    }
  ],
  "studentPayoffEyebrow": "Why it helps",
  "studentPayoffTitle": "Students answer because the result helps them too.",
  "studentPayoffSubtitle": "A class rep needs responses. Synco gives students a reason to complete the survey: their own team, best-fit classmates, risky pairings, and plain proof they can use.",
  "productivityBenefits": [
    {
      "value": "Less",
      "title": "time wasted on group confusion",
      "text": "Synco helps the class spend less time arguing over teams and more time starting the actual work."
    },
    {
      "value": "Top 5",
      "title": "classmates to consider",
      "text": "Each student gets a useful best-fit list with reasons based on schedule, effort, style, and strengths."
    },
    {
      "value": "5",
      "title": "pairings to handle carefully",
      "text": "Synco also shows risky pairings so students can avoid repeat problems before deadlines get close."
    }
  ],
  "matchingIntroEyebrow": "Upgraded matching engine",
  "matchingIntroTitle": "Built to find useful teams, not just similar people.",
  "matchingIntroSubtitle": "The matcher looks for balance: people who can meet, work at a similar seriousness level, and bring different strengths to the same project.",
  "matchingLead": "Synco checks pair fit and full-team balance together. It rewards complementary strengths, respects hard avoid rules, treats mutual requests carefully, and flags teams that need a plan before students start.",
  "matchingFactors": [
    {
      "title": "Meeting reality",
      "text": "Shared free time and schedule habits matter because teams fail fast when they cannot actually meet."
    },
    {
      "title": "Complementary strengths",
      "text": "Synco does not just stack the same strong students together. It looks for people who cover each other's gaps."
    },
    {
      "title": "Thinking and work style",
      "text": "Planning style, communication pace, deadline habits, and effort level are checked before a pair is treated as strong."
    },
    {
      "title": "Hard rules and requests",
      "text": "Do-not-pair notes are kept apart, mutual friend requests are honored up to team size, and one-sided requests stay as soft hints."
    },
    {
      "title": "Team safety checks",
      "text": "Low schedule fit, weak role balance, duplicate strengths, and isolated teammates are flagged before teams are treated as safe."
    },
    {
      "title": "Proof-based results",
      "text": "Students do not just get a score. They see the proof: meeting fit, skill coverage, work rhythm, and what to agree on first."
    }
  ],
  "outputCards": [
    {
      "label": "For each team",
      "title": "A team quality check",
      "text": "Synco scores the whole team, not only one pair at a time, so weak links and role gaps are easier to spot."
    },
    {
      "label": "For each student",
      "title": "Best matches and watch-outs",
      "text": "Each student sees who may be easier to work with, who needs caution, and the reason behind both lists."
    },
    {
      "label": "For the lead",
      "title": "Review flags before work starts",
      "text": "Teams that are legal but fragile are marked for review so the class can plan around risk early."
    }
  ],
  "featuresEyebrow": "For the class",
  "featuresTitle": "Less sorting before group work starts.",
  "featuresSubtitle": "Synco handles the repeated sorting work so class reps can move everyone into the project with fewer arguments and less guessing.",
  "classBenefits": [
    {
      "title": "No sorting names by hand",
      "text": "Stop moving names around and hoping the teams still feel fair."
    },
    {
      "title": "No checking every request by hand",
      "text": "Friend requests and do-not-pair notes are checked before teams are shared."
    },
    {
      "title": "Fewer last-minute team changes",
      "text": "Make teams with enough context to avoid moving people around again and again."
    },
    {
      "title": "A clear reason for each team",
      "text": "Each team includes a short explanation in plain language."
    },
    {
      "title": "Know who fits you better",
      "text": "Each person can see classmates they may work well with."
    },
    {
      "title": "Know who may be harder",
      "text": "Synco also shows pairings that may need more care or may be best avoided."
    }
  ],
  "faqIntroEyebrow": "Practical details",
  "faqIntroTitle": "Questions before you start",
  "faqIntroSubtitle": "Simple answers for students joining a class and CRs setting one up.",
  "faqs": [
    {
      "id": "join",
      "question": "I am a student. Can I use Synco without creating a class?",
      "answer": "Yes. If your class rep or lead gives you a code, you can join the class, answer the survey, and see your result after teams are published."
    },
    {
      "id": "questions",
      "question": "Will the survey feel boring or too personal?",
      "answer": "The survey is split into shorter parts and uses simple questions about how you work: free time, work habits, goals, strengths, friend requests, and do-not-pair notes. It is for better teams, not judging people."
    },
    {
      "id": "algorithm",
      "question": "Does Synco just match similar students together?",
      "answer": "No. Similar schedules and goals help, but Synco also looks for complementary strengths, role balance, shared weak spots, and team safety. A strong team should cover more of the project, not just repeat the same strengths."
    },
    {
      "id": "privacy",
      "question": "Will classmates see my private answers?",
      "answer": "No. Raw answers are not shown to classmates. Results focus on your team, your closest matches, people you may want to avoid, and short reasons that explain the match."
    },
    {
      "id": "individual",
      "question": "What do students get after results are published?",
      "answer": "Students get their assigned team, teammates, a working-style profile, best classmates to consider, risky pairings to handle carefully, and plain reasons for the result."
    },
    {
      "id": "avoid",
      "question": "Can Synco keep two people apart?",
      "answer": "Yes. If someone lists a do-not-pair name, Synco treats that as a rule and avoids putting those people on the same team."
    },
    {
      "id": "late",
      "question": "Can a class rep update teams later?",
      "answer": "Teams work best when everyone answers before they are made. If someone joins late, the class can collect their answers and make or update the team plan before sharing results."
    },
    {
      "id": "odd",
      "question": "What if the class number does not split evenly?",
      "answer": "Synco still places everyone. If a perfect split is not possible, the leftover people are added to teams where they fit best."
    }
  ],
  "finalCtaEyebrow": "Start with one class",
  "finalCtaTitle": "Ready to create your first class link?",
  "preview": {
    "headerTitle": "Class results preview",
    "headerSubtitle": "Teams + student match profiles",
    "badge": "Ready to publish",
    "stats": [
      ["Invite code", "H7K2"],
      ["Answers", "24 / 28"],
      ["Team size", "4"]
    ],
    "teams": [
      {
        "name": "Team 1",
        "members": "Maya, Noor, Ezra, Jules",
        "rationale": "Strong schedule overlap with mixed planning styles and different useful strengths.",
        "fit": "92% fit"
      },
      {
        "name": "Why it works",
        "members": "Planning, research, writing, review",
        "rationale": "The group covers more of the project instead of repeating one skill.",
        "fit": "92% fit"
      }
    ],
    "peopleTitle": "Personal match guide",
    "people": [
      ["Best fits", "Noor, Ari, Lina"],
      ["Be careful with", "Theo, Sam"]
    ],
    "graphTitle": "Class team map",
    "graphSubtitle": "Classmates settle into balanced teams as fit and avoid rules are applied.",
    "graphBadge": "4 teams"
  }
}$content$
)
on conflict (content_key) do nothing;

create or replace function public.admin_list_platform_content()
returns table (
  content_key text,
  title text,
  summary text,
  body text,
  updated_at timestamptz,
  updated_by uuid,
  updated_by_email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  return query
  select
    pc.content_key,
    pc.title,
    pc.summary,
    pc.body,
    pc.updated_at,
    pc.updated_by,
    au.email::text as updated_by_email
  from public.platform_content pc
  left join auth.users au on au.id = pc.updated_by
  order by case pc.content_key
    when 'landing_page' then 1
    when 'privacy_policy' then 2
    when 'terms_of_service' then 3
    when 'contact_page' then 4
    else 99
  end;
end;
$$;

create or replace function public.admin_upsert_platform_content(
  _content_key text,
  _title text,
  _summary text,
  _body text
)
returns public.platform_content
language plpgsql
security definer
set search_path = public
as $$
declare
  _normalized_key text := lower(trim(coalesce(_content_key, '')));
  _saved public.platform_content;
begin
  perform public.admin_assert();

  if _normalized_key not in ('landing_page', 'privacy_policy', 'terms_of_service', 'contact_page') then
    raise exception 'invalid_platform_content_key' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(_title, '')), '') is null then
    raise exception 'platform_content_title_required' using errcode = '23514';
  end if;

  if nullif(trim(coalesce(_body, '')), '') is null then
    raise exception 'platform_content_body_required' using errcode = '23514';
  end if;

  if _normalized_key = 'landing_page' then
    begin
      perform _body::jsonb;
    exception when others then
      raise exception 'landing_page_json_invalid' using errcode = '22023';
    end;
  end if;

  insert into public.platform_content (content_key, title, summary, body, updated_at, updated_by)
  values (
    _normalized_key,
    trim(_title),
    nullif(trim(coalesce(_summary, '')), ''),
    trim(_body),
    now(),
    auth.uid()
  )
  on conflict (content_key) do update
  set title = excluded.title,
      summary = excluded.summary,
      body = excluded.body,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
  returning * into _saved;

  perform public.admin_write_audit(
    'update_platform_content',
    'platform_content',
    null,
    jsonb_build_object('content_key', _normalized_key, 'title', _saved.title)
  );

  return _saved;
end;
$$;

revoke all on function public.admin_upsert_platform_content(text, text, text, text) from public;
grant execute on function public.admin_upsert_platform_content(text, text, text, text) to authenticated;

revoke all on function public.admin_list_platform_content() from public;
grant execute on function public.admin_list_platform_content() to authenticated;
