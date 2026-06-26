# Synco

Synco is a classroom collaboration platform for creating project teams from real working-fit signals instead of guesswork. Class leads create a class, students join with an invite code, everyone completes a survey, and Synco publishes assigned teams plus individual compatibility profiles.

The product is built around two outputs:

- Assigned teams for the class lead and students.
- Individual results for each student: top matches, watch-outs, team context, comparison details, and feedback.

## Documentation

Start here:

- [Product Guide](docs/PRODUCT_GUIDE.md): roles, user journeys, feature map, and page-by-page behavior.
- [Architecture](docs/ARCHITECTURE.md): frontend/backend structure, file map, data flow, and route map.
- [Supabase And Data Model](docs/SUPABASE_AND_DATA_MODEL.md): tables, RLS, RPCs, migrations, and schema workflow.
- [Matching Engine](docs/MATCHING_ENGINE.md): survey inputs, scoring model, team formation, forced constraints, and result payloads.
- [Operations](docs/OPERATIONS.md): local setup, environment variables, testing, deploy notes, migration process, and admin setup.
- [Security And Privacy](docs/SECURITY_AND_PRIVACY.md): auth model, privacy rules, admin access, key handling, and incident checklist.
- [Agent Handoff](AGENT_HANDOFF.md): chronological implementation log for future coding sessions.
- [Deep Research Report](deep-research-report.md): research notes used to improve the matching model.

## Tech Stack

- React 19
- TanStack Router / TanStack Start
- Vite
- Tailwind CSS 4
- Framer Motion
- Supabase Auth, Postgres, RLS, RPC functions
- TypeScript
- Vitest
- ESLint / Prettier

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local `.env` or configure your deployment provider with:

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

The client also accepts these aliases for deployment compatibility:

- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `PUBLIC_SUPABASE_ANON_KEY`

Run the app:

```bash
npm run dev
```

Run checks:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Product Summary

Lead flow:

1. Sign up or log in.
2. Choose the lead role.
3. Create a class with a team size, identifier type, optional roll-number format, and optional roster lock.
4. Share the invite code or join link.
5. Monitor submissions.
6. Publish or republish results.
7. Review assigned teams, student match profiles, feedback, and risk flags.

Student flow:

1. Open a class link or enter a code.
2. Create a student account or sign in with an existing account.
3. Join the class with a normalized roll number, student ID, or email.
4. Complete the survey.
5. Return after publish to see assigned team, best matches, avoid/watch list, compatibility proofs, and comparison details.

Admin flow:

1. Sign in as a platform admin.
2. Open `/admin` or the dashboard's `Master Control` button.
3. Monitor users, classes, activity, survey counts, match results, feedback, audit log, and destructive controls.

## Important Safety Notes

- Never commit Supabase personal access tokens, database passwords, service-role keys, or user passwords.
- Use the publishable/anon key only for the frontend.
- Use Supabase migrations for schema changes. Add new migration files instead of editing old ones.
- Admin RPCs are intentionally powerful. Grant platform-admin access only to trusted accounts.

## Repository Layout

```text
src/
  components/              Shared UI and animation helpers
  hooks/                   Auth and confirmation dialog hooks
  integrations/supabase/   Supabase client and generated database types
  lib/                     Matching, class helpers, survey definitions, team snapshots
  routes/                  TanStack route components
supabase/
  migrations/              Database schema, RLS, and RPC history
docs/                      Human documentation
```

## Current Status

The core platform is implemented and connected:

- Auth, password reset, lead/student onboarding.
- Class creation with team size and identifier normalization.
- Student join flow with account-based cross-device access.
- Survey and saved responses.
- Publishing with team assignment snapshots.
- Student result profiles.
- Feedback RPC and lead-side feedback summary.
- Roster privacy.
- Platform admin panel.

Known areas for future improvement are listed in the docs, especially around survey UX grouping, large-route refactors, and deeper admin analytics.
