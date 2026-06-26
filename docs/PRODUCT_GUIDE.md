# Product Guide

This guide explains what Synco does from the point of view of each user type.

## What Synco Is

Synco helps classes form better project teams. It does not only make random groups. It checks students' availability, working habits, academic goals, communication style, strengths, weak areas, friend requests, and do-not-pair boundaries.

Synco produces:

- A class-level team assignment.
- A student-level result profile.
- Best-match suggestions.
- Avoid/watch-out suggestions.
- Compatibility proofs and risk explanations.
- A teacher/lead view for publishing, reviewing, and republishing results.

## User Roles

### Class Lead

A class lead creates and manages classes. This is usually a teacher, instructor, lab lead, CR, or project coordinator.

Lead capabilities:

- Create classes.
- Set expected student count.
- Choose team size from 2 to 6.
- Choose identifier type: roll number, email, or student ID.
- Configure roll-number format, such as `SP25-BCS-006`.
- Enable or skip roster lock.
- Upload/paste roster identifiers.
- Copy invite code or join link.
- Monitor joined students and completed surveys.
- Publish and republish results.
- See assigned teams.
- See feedback summary from students.
- Delete student surveys.
- Delete classes from dashboard.
- Set up a demo class.

### Student

A student joins a class and fills the survey.

Student capabilities:

- Create a student account with email and password.
- Sign in from any device using the same account.
- Join a class by invite link or code.
- Enter a normalized class identifier.
- Complete the survey.
- See class hub status.
- See assigned team after publish.
- See their top matches and watch-outs.
- Search/compare peers from the result page where data is available.
- Send post-match feedback.

### Platform Admin

A platform admin has full-platform oversight through `/admin`.

Admin capabilities:

- View user counts, class counts, survey counts, match result counts, and feedback totals.
- See active users based on heartbeat rows.
- Search users.
- Search classes.
- Inspect user details and class details.
- Grant or revoke platform-admin access.
- Change a user's role.
- Delete classes.
- Delete users.
- Review admin audit log.

Admin access is controlled by database allowlist and/or Auth app metadata. See [Security And Privacy](SECURITY_AND_PRIVACY.md).

## Main Product Flows

## Lead Flow

1. Lead signs up at `/auth/signup`.
2. Lead chooses `I'm running a class` at `/onboarding/role`.
3. Lead reaches `/dashboard`.
4. Lead creates a class at `/class/new`.
5. Lead configures:
   - Class name.
   - Institution/course.
   - Expected student count.
   - Team size.
   - Identifier type.
   - Roll-number format if using roll numbers.
   - Roster lock if needed.
6. Synco creates a class and invite code.
7. Lead shares the code/link.
8. Students join and submit surveys.
9. Lead opens `/class/$id`.
10. Lead publishes results.
11. Synco writes one `match_results` row per completed student and stores the class team snapshot on `classes.team_assignments`.
12. Lead reviews assigned teams, warnings, feedback, and individual rows.

## Student Join Flow

1. Student opens `/join/$code` or `/join`.
2. If signed out, the page shows an account gate:
   - `Create student account`
   - `I already have an account`
3. The invite code is saved locally as a pending join code.
4. Signup/login redirects back to the join flow.
5. Student enters their name and identifier.
6. Supabase RPC `join_class_by_code` validates the code, normalizes the identifier, checks roster lock, and creates membership.
7. Student lands on `/c/$id`.
8. Student starts the survey at `/survey/guide` and `/survey`.

This avoids device dependency. Results are tied to the Supabase user account, not one browser.

## Survey Flow

The survey has:

- 22 slider questions from `src/lib/questions.ts`.
- Detail steps for availability, skills, planning, logistics, and preferences.
- Optional text fields:
  - `wantToWorkWith`
  - `friendsInClass`
  - `doNotPairWith`

Responses are saved progressively to `survey_responses`. Completion sets `completed=true` and `submitted_at`.

## Publish Flow

Publishing happens in `src/routes/class.$id.tsx`.

At publish time Synco:

1. Loads completed survey responses.
2. Builds `MatchStudent` records.
3. Builds a peer signal map from free-text references and exact identifiers.
4. Creates team assignments using `formTeams`.
5. Creates student-specific ranked peer lists.
6. Splits peers into matches and avoid/watch-out lists.
7. Adds assigned team data to each student result.
8. Writes `match_results` rows.
9. Stores the full team assignment snapshot on `classes.team_assignments`.
10. Marks the class as published.

Republishing repeats the same process with a newer results version.

## Student Results Flow

Students open `/results` after publish.

They see:

- Their archetype.
- Work-style meters.
- Assigned team card.
- Teammates and team rationale.
- Top matches.
- Avoid/watch-out cards.
- Friend Reality Check cards when a flagged friend scores poorly.
- Compatibility proofs.
- Risk proofs.
- Comparison/search area.
- Feedback buttons.

The top-5 and avoid lists coexist with team assignments. Team assignments are the class output; the lists are the individual guidance layer.

## Privacy Modes

Students can choose how visible they are in results:

- Show my name in results.
- Show name but keep reasons general.
- Lead introduction only.

Privacy affects roster and result copy. Leads still see full details for the class they manage.

## Route Map

Public and auth:

- `/`: landing page.
- `/auth/signup`: create account.
- `/auth/login`: sign in.
- `/auth/forgot-password`: request reset email.
- `/auth/reset-password`: set a new password after recovery link.
- `/terms`: terms.
- `/privacy`: privacy policy.

Onboarding and dashboard:

- `/onboarding/role`: choose lead or student.
- `/dashboard`: lead dashboard and admin shortcut.
- `/admin`: platform admin panel.

Class and survey:

- `/class/new`: create class.
- `/class/$id`: lead class management and publish page.
- `/join`: enter code.
- `/join/$code`: join with invite code.
- `/c/$id`: student class hub.
- `/c/$id/roster`: class roster.
- `/survey/guide`: survey intro.
- `/survey`: survey form.
- `/survey/done`: submission complete.
- `/results`: student result profile.

## Current Feature Status

Implemented:

- Account-based auth for leads and students.
- Cross-device student results through email/password accounts.
- Password reset completion route.
- Role onboarding.
- Class creation.
- Join codes.
- Roster lock.
- Roll-number normalization.
- Survey save/complete flow.
- Publish/republish.
- Team assignments.
- Individual results.
- Feedback RPC.
- Roster privacy.
- Demo class setup scoped to the signed-in lead.
- Platform admin panel.

Future improvements:

- Group the long survey into fewer visible steps.
- Add lead-side filtering/search to large class pages.
- Split very large route files into smaller components.
- Add richer admin analytics and export tools.
- Add more validation with Zod across form/RPC payloads.
