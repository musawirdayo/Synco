# Architecture

Synco is a React application backed by Supabase Auth, Postgres, RLS, and security-definer RPC functions.

## High-Level Shape

```text
Browser
  React + TanStack Router
  Supabase client
    |
    | Auth, table reads/writes, RPC calls
    v
Supabase
  Auth users
  Postgres tables
  Row Level Security
  Security-definer functions
```

## Frontend Stack

- React 19.
- TanStack Router / TanStack Start.
- Vite.
- Tailwind CSS 4.
- Framer Motion.
- Lucide icons.
- Radix primitives for dialogs/accordions.
- Supabase JS client.

## Backend Stack

- Supabase Auth for email/password accounts.
- Supabase Postgres for app data.
- RLS policies for lead/student data access.
- Security-definer RPC functions for sensitive writes and admin actions.
- SQL migrations in `supabase/migrations`.

## Important Directories

```text
src/components/
  Shared UI components, route error boundary, skeletons, animation helpers.

src/hooks/
  use-auth.ts
  use-confirm-dialog.tsx

src/integrations/supabase/
  client.ts
  types.ts

src/lib/
  class-flow.ts
  class-helpers.ts
  questions.ts
  synco.ts
  team-assignments.ts
  supabase-safe.ts

src/routes/
  TanStack route components.

supabase/migrations/
  Database schema, RLS, RPCs, and schema evolution.
```

## Core Libraries

### `src/lib/class-flow.ts`

Handles:

- Invite code normalization.
- Student identifier normalization.
- Roll-number prefix/suffix formatting.
- Active class local storage.
- Pending join code local storage.
- Latest membership lookup.

This is the glue that makes class links work across signup/login.

### `src/lib/questions.ts`

Defines:

- Slider survey questions.
- Optional free-text peer fields.

This is the source of truth for the survey's question IDs and labels.

### `src/lib/synco.ts`

The matching engine.

Exports:

- Pair scoring helpers.
- Archetypes and work-style meters.
- Peer reference resolution.
- Block/request/friend logic.
- Pair insights and friction insights.
- Compatibility proof generation.
- Risk proof generation.
- Team quality scoring.
- `maximumWeightMatching`.
- `formTeams`.

### `src/lib/team-assignments.ts`

Converts matching plans into persisted assignment snapshots.

Exports:

- `buildTeamAssignmentSnapshot`
- `teamAssignmentForStudent`
- `studentIsUnmatched`

The stored snapshot is stable enough for teacher and student pages to read without recomputing teams.

### `src/lib/class-helpers.ts`

Presentation and export helpers for class/results flows:

- Risk pairs.
- Public peer names.
- Privacy-safe insight text.
- Readiness cards.
- CSV helpers.
- HTML escaping.

### `src/lib/supabase-safe.ts`

Wrapper used by some flows to require Supabase errors to be checked instead of silently ignored.

## Route Groups

### Landing and Legal

- `index.tsx`: marketing landing page.
- `terms.tsx`: terms page.
- `privacy.tsx`: privacy page.

### Auth

- `auth.signup.tsx`
- `auth.login.tsx`
- `auth.forgot-password.tsx`
- `auth.reset-password.tsx`

Auth uses Supabase email/password. Signup from a pending class link creates a student profile and returns to join flow.

### Onboarding

- `onboarding.role.tsx`

Writes `profiles.role`.

### Lead

- `dashboard.tsx`
- `class.new.tsx`
- `class.$id.tsx`

Lead pages manage classes, invite codes, publishing, deletion, and demo class setup.

### Student

- `join.tsx`
- `join_.$code.tsx`
- `c.$id.tsx`
- `c.$id_.roster.tsx`
- `survey_.guide.tsx`
- `survey.tsx`
- `survey_.done.tsx`
- `results.tsx`

Student pages handle joining, survey submission, class hub, roster, and result profile.

### Admin

- `admin.tsx`

Calls admin RPCs. Does not use service-role keys in the frontend.

## Data Flow: Joining A Class

```text
Join link/code
  -> signed-out account gate
  -> signup/login
  -> pending invite code returns user to join page
  -> lookup_class_by_code
  -> join_class_by_code
  -> class_members row
  -> survey hub
```

## Data Flow: Completing Survey

```text
Survey step
  -> local React state
  -> survey_responses upsert
  -> completed=false for drafts
  -> completed=true and submitted_at on final step
```

## Data Flow: Publishing Results

```text
class.$id lead page
  -> classes row
  -> class_members rows
  -> completed survey_responses
  -> formTeams()
  -> buildTeamAssignmentSnapshot()
  -> rankedPeersFor each student
  -> match_results upsert
  -> classes.team_assignments update
  -> classes.is_published=true
```

## Data Flow: Viewing Results

```text
results route
  -> active class ID from local storage or latest membership
  -> own match_results row
  -> class team_assignments
  -> render profile, team, matches, avoid list, comparisons
  -> platform-scoped submit_match_feedback RPC
```

## Error Handling

Routes use a mix of:

- Local `try/catch` with friendly messages.
- `RouteErrorFallback`.
- Root route error boundary.
- `checkedSupabase` where adopted.

Important rule: Supabase errors should be checked and surfaced. Silent errors caused earlier bugs, especially feedback writes.

## Frontend Styling Rules In Practice

The app uses:

- Tailwind utilities.
- CSS variables in `src/styles.css`.
- Rounded cards with `border border-border bg-card`.
- Framer Motion for subtle transitions.
- Custom reusable reveal animations on the landing page.

## Build Output

The app builds through Vite/TanStack Start/Nitro:

```bash
npm run build
```

Preview after build:

```bash
npx vite preview
```

## Large Files To Watch

These files are feature-rich and should eventually be split:

- `src/routes/class.$id.tsx`
- `src/routes/results.tsx`
- `src/lib/synco.ts`

They are not wrong just because they are large, but future changes should consider extracting focused components and pure helpers.
