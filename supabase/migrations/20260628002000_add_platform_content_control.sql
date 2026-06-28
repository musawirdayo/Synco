-- Public content pages that can be edited from Master Control.
-- The pages remain public-read, but only platform admins can write them through RPCs.

create table if not exists public.platform_content (
  content_key text primary key,
  title text not null,
  summary text,
  body text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint platform_content_key_check
    check (content_key in ('privacy_policy', 'terms_of_service', 'contact_page')),
  constraint platform_content_title_not_blank check (length(trim(title)) > 0),
  constraint platform_content_body_not_blank check (length(trim(body)) > 0)
);

alter table public.platform_content enable row level security;

drop policy if exists "public read platform content" on public.platform_content;
create policy "public read platform content"
on public.platform_content
for select
to anon, authenticated
using (true);

grant select on public.platform_content to anon, authenticated;

insert into public.platform_content (content_key, title, summary, body)
values
(
  'privacy_policy',
  'Privacy policy',
  'This Privacy Policy explains how Synco handles account, class, survey, result, feedback, and operational data.',
  $content$## 1. What this policy covers
This Privacy Policy explains how Synco collects, uses, shares, stores, and deletes information when people use the platform to create classes, join classes, answer team questions, and view team results.

Synco is built for class team formation. We try to collect only the information needed to help a class make fairer teams and explain those teams in plain language.

## 2. Information we collect
- Account information: name, email address, password handled through authentication tools, profile role, and login details needed to keep your account working.
- Class information: class name, invite code, expected class size, team size, class settings, and whether joining is limited to certain identifiers.
- Join information: display name, roll number, email, student ID, or similar identifier if the class requires it.
- Survey answers: answers about free time, work habits, class goals, skills, preferred teammates, do-not-pair names, friends in class, and similar team-forming details.
- Team results: team assignments, match scores, match reasons, people to work well with, people to be careful with, and version history for shared results.
- Feedback: simple feedback choices or comments about whether a result was useful.
- Technical information: device, browser, app logs, error logs, security events, and basic usage data needed to run, protect, and improve Synco.
- Admin operation information: recent activity such as last seen time, recent page path, and browser details so platform admins can monitor security, support issues, and service health.

## 3. How we use information
- To create accounts and let people sign in.
- To let class leads create classes and classmates join the correct class.
- To collect answers and make team suggestions.
- To explain why a team or match was suggested.
- To show each person their own results and team information.
- To help class leads manage class membership, missing responses, late responses, and shared results.
- To prevent abuse, protect accounts, fix bugs, and keep the platform reliable.
- To let authorized platform admins review activity, investigate problems, handle support, and remove abusive or broken data.
- To respond to support requests and improve Synco.

## 4. Who can see what
Classmates do not see each other's raw survey answers. Results shown to classmates focus on their own team, teammates, match reasons, and any personal match lists made available by the app.

A class lead may see class membership, display names, identifiers used for joining, submission status, team assignments, shared result summaries, and other class management information.

A small number of authorized platform admins may see account, class, survey, result, feedback, activity, and audit details across the platform to operate and protect Synco. Admin actions may be logged.

## 5. How information is shared
We do not sell personal information. We do not use student answers for third-party advertising.

We may share information with service providers that help run Synco, such as hosting, database, authentication, email, security, analytics, or error logging providers. They may process information only to provide those services to Synco.

We may share information if required by law, to protect people, to investigate abuse, to secure the service, or to respond to a valid legal request.

## 6. Student and minor privacy
Synco may be used by students. If a class includes minors, the class lead or school should make sure they have the right permission before inviting students and collecting answers.

Children under 13 should not use Synco unless a school, parent, guardian, or other authorized adult has approved the use.

## 7. How long we keep information
Synco keeps information for as long as needed to provide the class, show results, maintain accounts, protect the service, comply with legal duties, and handle support or disputes.

Class data may be deleted when a class lead deletes the class, when an account is removed, or when Synco no longer needs the data. Some copies may remain for a limited time in backups, logs, security records, or legal records.

## 8. Your choices
- You can choose not to join a class or not to submit answers, but that may mean you cannot be included in team results.
- You can ask the class lead to correct your name, identifier, or class membership if it is wrong.
- You can ask for your account or class data to be deleted through the available support contact.
- If your school controls the class, you may need to make access, correction, or deletion requests through the school or class lead.

## 9. Security
Synco uses reasonable technical and organizational measures to protect information, including access controls, authentication, database security rules, and limited access to class data.

No online service can promise perfect security. If you think your account or class data has been exposed, tell the class lead or Synco support as soon as possible.

## 10. Changes to this policy
We may update this Privacy Policy as Synco changes. If the changes are important, we will try to give notice in the app or by another reasonable method.

## 11. Contact
For privacy questions, use the support contact provided in the app, class invite, or contact page.$content$
),
(
  'terms_of_service',
  'Terms of service',
  'These terms explain how Synco may be used for class team formation, student results, and platform administration.',
  $content$## 1. What Synco does
Synco helps a class make student teams. A class lead creates a class, shares a code, classmates answer a short form, and Synco suggests teams with short reasons.

Synco is a planning tool. It does not make final school, grading, discipline, safety, or legal decisions. A real person should review the team plan before using it in class.

## 2. Who can use Synco
You may use Synco if you can legally agree to these terms, or if a school, parent, guardian, or class lead has allowed you to use it for a class.

If you are under 13, you may use Synco only when your school, parent, guardian, or another authorized adult has approved that use.

If you create a class for other people, you are responsible for making sure you have permission to invite them and collect their class responses.

## 3. Accounts and class roles
- Keep your login details private and do not share another person's account.
- Use your real class name or display name when a class requires it.
- A class lead can create a class, set a team size, manage who joins, view submitted class responses as allowed by the app, generate team results, and share those results.
- A class member can join a class, submit answers, see their own results, and see the team information made available to them.
- Authorized platform admins can review accounts, classes, survey records, team results, feedback, activity records, and audit logs to operate Synco, investigate problems, and protect the service.

## 4. Your content and class data
Your content includes names, class details, join identifiers, form answers, do-not-pair notes, friend or work-with requests, team results, feedback, and any other information added to Synco.

You keep any rights you already have in your content. By adding content to Synco, you allow Synco to use it only to run the service, create teams, show results, protect the service, fix problems, and provide support.

Do not add private information that is not needed for making teams. Do not add home addresses, medical details, government ID numbers, passwords, payment details, or other sensitive information unless Synco clearly asks for it.

## 5. Team suggestions and results
Synco uses answers and class rules to suggest teams. The result may be useful, but it may not be perfect.

Team reasons are meant to explain the suggestion in simple terms. They should not be treated as a complete judgment of a person's ability, character, effort, or value.

If a team result looks wrong, unfair, unsafe, or based on bad data, the class lead should review it before using it.

## 6. Things you must not do
- Do not use Synco to bully, harass, shame, threaten, or single out another person.
- Do not submit false answers to manipulate team results.
- Do not try to view a class, answer, account, or result you are not allowed to see.
- Do not upload malware, attack the app, scrape private data, or try to bypass security.
- Do not use Synco for illegal activity or in a way that breaks school rules that apply to you.
- Do not use team results as the only basis for grading, punishment, formal complaints, or other serious decisions.

## 7. Privacy
The Privacy Policy explains what information Synco collects, how it is used, who may see it, and how deletion requests work. By using Synco, you agree that your information will be handled as described there.

## 8. School and class responsibilities
If Synco is used for a school class, the school or class lead may have separate duties under school policy or student privacy laws. Synco does not replace those duties.

Class leads are responsible for choosing an appropriate team size, checking results before sharing them, handling late answers fairly, and responding to student concerns.

## 9. Service availability
Synco may change, pause, or stop parts of the service. We try to keep it working, but we do not promise that it will always be available, error-free, or fit every class situation.

## 10. Third-party services
Synco may use trusted service providers for hosting, login, database storage, email, analytics, error logging, and similar operations.

## 11. Ending use and deleting data
You can stop using Synco at any time. A class lead may delete a class, and account or data deletion requests can be sent through the available support contact.

Some information may remain for a limited time in backups, logs, security records, or records needed to comply with law, prevent abuse, or resolve disputes.

## 12. Intellectual property
Synco, including its name, design, code, text, and product experience, belongs to its owner or licensors. You may not copy, resell, or rebuild the service without permission.

## 13. Disclaimers
Synco is provided as-is and as-available. To the fullest extent allowed by law, we disclaim implied warranties, including warranties of merchantability, fitness for a particular purpose, and non-infringement.

## 14. Limitation of liability
To the fullest extent allowed by law, Synco will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost data, lost work, lost grades, or class disputes caused by use of the service.

## 15. Changes to these terms
We may update these terms as Synco changes. If changes are important, we will try to give notice in the app or by another reasonable method.

## 16. Contact
For questions about these terms, use the support contact provided in the app, class invite, or contact page.$content$
),
(
  'contact_page',
  'Contact Synco',
  'Need help with a class, a student account, privacy, or platform feedback? Use the contact details below.',
  $content$## Support
For account, class, or result issues, contact Synco support at abdulmusawirdayo35@gmail.com.

## What to include
- Your name
- Your class name or invite code, if the issue is about a class
- The email you used for Synco
- A short explanation of what happened

## Privacy or deletion requests
For privacy questions, account deletion, or class-data deletion, mention "privacy request" in your message so it can be handled carefully.

## Response time
Synco is early-stage, so response times may vary. Urgent class issues should also be shared with the class lead or instructor.$content$
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
    when 'privacy_policy' then 1
    when 'terms_of_service' then 2
    when 'contact_page' then 3
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

  if _normalized_key not in ('privacy_policy', 'terms_of_service', 'contact_page') then
    raise exception 'invalid_platform_content_key' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(_title, '')), '') is null then
    raise exception 'platform_content_title_required' using errcode = '23514';
  end if;

  if nullif(trim(coalesce(_body, '')), '') is null then
    raise exception 'platform_content_body_required' using errcode = '23514';
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

revoke all on function public.admin_list_platform_content() from public;
grant execute on function public.admin_list_platform_content() to authenticated;

revoke all on function public.admin_upsert_platform_content(text, text, text, text) from public;
grant execute on function public.admin_upsert_platform_content(text, text, text, text) to authenticated;
