# Agent Handoff

Last updated: 2026-06-25

This file is the durable project log for Codex sessions. Read it before making backend or migration changes.

## Repo State

- Repo: `https://github.com/musawirdayo/Synco.git`
- Branch: `main`
- Active Supabase project ref: `eygmcjkhvtgvokkuqomg`
- `supabase/config.toml` has been updated to the active restored backend.

## Current Feature Work

This sync set adds:

- Class creation `team_size` field, default `4`, allowed range `2` through `6`.
- New `classes.team_size` column migration.
- New `classes.team_assignments` JSONB column migration.
- Optional survey field `wantToWorkWith`.
- `mutualRequest()` and `formTeams()` in `src/lib/synco.ts`.
- Team assignment persistence during publish.
- Teacher team view on the class page after publishing.
- Student team view on the results page while preserving top-5 and bottom-5 peer results.
- Unit tests for new team formation and request behavior.
- Optional `friendsInClass` survey field and flagged-friend risk warnings on avoid result cards.

## Verification Already Run

These passed after the feature work:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`
- 2026-06-24 follow-up: `npm test` reports 75 passing tests after flagged-friend risk tests.
- `npm exec --yes supabase -- migration list --linked` shows every local migration version matched on remote.
- `npm exec --yes supabase -- db push --linked --dry-run` reports `Remote database is up to date.`

GitHub Actions note:

- Commit `6fe3096` deployed successfully on Vercel, but GitHub CI failed in `npm test` on Ubuntu because the lockfile lacked Linux native package entries.
- Follow-up package metadata adds `lightningcss-linux-x64-gnu` and `@tailwindcss/oxide-linux-x64-gnu` as optional dependencies so Ubuntu CI can install them.

Manual end-to-end verification in `npm run dev` is still TODO unless a later log entry says otherwise.

## 2026-06-25 Feature-Map Hardening Pass

Implemented locally:

- Added `supabase/migrations/20260625001000_make_demo_class_per_lead.sql`, redefining `setup_demo_class` so it still requires `_lead_id = auth.uid()` and no longer deletes the global `DEMO12` class for every user. Each lead now gets a deterministic private demo invite code, and only that lead's prior demo class is removed.
- Updated `src/routes/dashboard.tsx` with a clear error message for private demo code reservation failures.
- Updated `src/routes/c.$id_.roster.tsx` so non-leads do not fetch every peer display name, and roster names/submission status are hidden unless the viewer is the lead, the row is the current student, or the published privacy-safe result name reveals the peer.
- Updated `src/routes/class.$id.tsx` so publish uses the actual `formTeams()` output when writing per-student result metadata: assigned teammates are marked, assigned partner/team IDs are stored, readiness reflects the assigned team, and the matching algorithm is recorded as `maximum-weight` or `greedy-clustering`.
- Added lead-visible student feedback on the class page: dashboard summary count plus each published student's `Useful / Unsure / Not useful` feedback state.

Follow-up functional-requirements review pass:

- Signup and forgot-password now map Supabase auth failures to friendly copy instead of showing raw provider messages.
- Removed the onboarding claim that users can "switch later" because no role-switching feature exists yet.
- Class creation now retries invite-code generation on unique-code collisions and shows friendly class-creation errors.
- Survey guide/join/reminder copy no longer undersells the survey as only "a few minutes"; the guide now says `22 core questions + optional details`.
- Fixed the `q15` scoring comment in `src/lib/synco.ts` so it matches the actual class/lab-presence question.
- Added dashboard-level confirmed class deletion for leads, using the existing `classes` cascade/RLS path. The class detail page already had delete.
- Confirmed root and route error boundaries already hide raw `error.message` / `error.stack` from users.

Verification passed after this pass:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (75 passing)
- `npm run build`
- Local dev server responded `200` on `http://127.0.0.1:8080/`
- Follow-up review verification also passed: `npx tsc --noEmit`, `npm run lint`, `npm test` (75 passing), and `npm run build`.

Remote Supabase note:

- After a Supabase access token was provided, the following pending local migrations were applied to the active remote project with `npm exec --yes supabase -- db push --linked`:
  - `20260624003000_restrict_setup_demo_class_to_current_user.sql`
  - `20260624004000_add_submit_match_feedback_rpc.sql`
  - `20260625001000_make_demo_class_per_lead.sql`
- `npm exec --yes supabase -- db push --linked --dry-run` reports `Remote database is up to date.`
- `npm exec --yes supabase -- migration list --linked` shows local and remote migration versions matched through `20260625001000`.

## 2026-06-25 Master Control Admin Panel

Implemented locally:

- Added `src/routes/admin.tsx`, a protected platform-admin control panel with platform metrics, heartbeat-based active users, user search/detail, class search/detail, audit log, role changes, admin grant/revoke, class deletion, and user deletion controls.
- Added `supabase/migrations/20260625002000_platform_admin_control_panel.sql`.
  - Creates `platform_admins`, `admin_presence`, and `admin_audit_log`.
  - Adds heartbeat RPC `record_presence()`.
  - Adds admin-only `SECURITY DEFINER` RPCs for overview/search/detail/admin actions.
  - Uses a client-callable `is_platform_admin(auth.uid())` check plus an ungranted internal helper for checking arbitrary users, so normal users cannot probe other users' admin status.
- Updated `src/routes/__root.tsx` to record signed-in user presence every 45 seconds and on route changes.
- Updated `src/routes/dashboard.tsx` to show a `Master Control` button only when the current account passes the admin allowlist check.
- Updated `src/integrations/supabase/types.ts` and `src/routeTree.gen.ts` for the new route/RPCs.
- Updated Terms and Privacy copy to disclose platform-admin operational monitoring and access.

Important admin bootstrap note:

- The panel is intentionally locked until an account is added to `public.platform_admins` or has Supabase Auth app metadata `platform_admin=true`.
- First-admin SQL example is shown on the denied admin page:
  `insert into public.platform_admins (user_id, note) select id, 'founder' from auth.users where email = 'your-email@example.com';`
- First platform-admin bootstrap has been completed directly on the remote database for the founder account. The email is intentionally not written here to avoid committing personal data.

Verification passed after this pass:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (75 passing)
- `npm run build`
- Dev server already running at `http://127.0.0.1:8080`; `/admin` returned HTTP 200 from the server.

Manual browser note:

- The Codex in-app browser reported `Browser is not available: iab`, and standalone Playwright is not installed in this repo, so no visual browser screenshot was captured in this session.

Remote Supabase note:

- After a Supabase access token was provided, `20260625002000_platform_admin_control_panel.sql` was applied to the active remote project with `npm exec --yes supabase -- db push --linked`.
- `npm exec --yes supabase -- migration list --linked` shows local and remote migration versions matched through `20260625002000`.
- `npm exec --yes supabase -- db push --linked --dry-run` reports `Remote database is up to date.`

## 2026-06-25 Non-Functional Hardening Pass

Implemented locally:

- Replaced remaining native browser `confirm()` / `alert()` dialogs in dashboard, class management, and admin controls with a reusable Radix AlertDialog-based confirmation hook.
- Added `src/components/ui/alert-dialog.tsx` and `src/hooks/use-confirm-dialog.tsx`.
- Added `src/lib/supabase-safe.ts` with `checkedSupabase()` for consistent checked Supabase result handling.
- Tightened survey loading/saving so failed Supabase reads/writes show a friendly error instead of silently advancing.
- Tightened class page loading, publish, unpublish, survey deletion, and class deletion error handling so failed writes are logged and surfaced.
- Added Zod validation to class-creation basics before the wizard advances.
- Updated the shared `Field` component to auto-link labels to direct `input`, `textarea`, and `select` children with stable ids.

Verification passed after this pass:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (75 passing)
- `npm run build`
- Search confirmed no remaining `window.confirm`, `window.alert`, or direct `alert(` calls in app routes/components/hooks.

## 2026-06-25 Auth Route Cleanup After External Edit

Cleaned up locally:

- Removed four empty duplicate auth files created by an external edit:
  - `login.tsx`
  - `signup.tsx`
  - `src/routes/login.tsx`
  - `src/routes/signup.tsx`
- Confirmed the real auth routes remain:
  - `src/routes/auth.login.tsx` -> `/auth/login`
  - `src/routes/auth.signup.tsx` -> `/auth/signup`

Verification passed after cleanup:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (75 passing)
- `npm run build`
- Fresh `npm run dev -- --host 127.0.0.1` started on `http://127.0.0.1:8080/`.
- `curl -I http://127.0.0.1:8080/auth/login` returned `HTTP/1.1 200`.
- `curl -I http://127.0.0.1:8080/auth/signup` returned `HTTP/1.1 200`.
- HTML checks confirmed the login and signup pages render their expected form text.

## 2026-06-25 Weak Feature Cleanup

Reviewed the "weak/useless features" list and confirmed these are no longer dead or misleading:

- `maximumWeightMatching` is now product-used through `formTeams()`, and publish writes the resulting team assignment into student results.
- Post-match feedback now writes through the `submit_match_feedback` RPC and the lead class page shows feedback summaries.
- Demo class seeding is now scoped to the caller's lead account through the newer RPC migrations.
- The false "switch roles later" onboarding copy was already removed.
- `zod` is now used for class-creation validation.

Additional cleanup completed:

- Deleted unused `src/hooks/use-mobile.tsx`.
- Chose Vercel/root app deployment as the authoritative checked-in target by removing the direct `@cloudflare/vite-plugin` dependency and root `wrangler.jsonc`.
- Updated direct TanStack router packages so `@tanstack/react-router`, `@tanstack/router-plugin`, and `@tanstack/router-core` resolve to compatible versions during the server build.
- Converted Vite `manualChunks` from package-name arrays to a resolver function so SSR-externalized packages do not break chunking.

Verification passed after this cleanup:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (75 passing)
- `npm run build`
- `git diff --check`

Note: the build still emits `.output/public/wrangler.json` from the underlying TanStack/Nitro/Lovable tooling, but the repo no longer has a root Cloudflare deployment config or a direct Cloudflare Vite dependency.

## Supabase Migration Situation

The restored Supabase backend is reachable and migration history has been reconciled as of this log update.

The remote had six historical migration versions that were not present in the repo. They are now represented by no-op placeholder files:

- `20260522000000_remote_history_placeholder.sql`
- `20260522001000_remote_history_placeholder.sql`
- `20260522002000_remote_history_placeholder.sql`
- `20260522003000_remote_history_placeholder.sql`
- `20260523000000_remote_history_placeholder.sql`
- `20260523001000_remote_history_placeholder.sql`

The restored remote had five local historical migration versions missing from its ledger. Their schema effects were verified or applied, then the versions were repaired as applied:

- `20260523221640`
- `20260523222956`
- `20260525041000`
- `20260525220000`
- `20260525223000`

Current feature migrations:

- `20260624000000_add_team_size_to_classes.sql`
- `20260624001000_add_team_assignments_to_classes.sql`
- `20260625002000_platform_admin_control_panel.sql`

A cleanup migration removes the duplicate legacy remote-only survey delete policy:

- `20260624001500_reconcile_restored_remote_policies.sql`
- `20260624002000_drop_legacy_survey_delete_policy.sql`

## Backend Changes Applied Remotely

The two new additive migrations above were applied directly to the active Supabase project with `supabase db query --linked --file ...`, then marked as applied with `supabase migration repair --status applied 20260624000000 20260624001000`.

The missing historical hardening migrations were then applied/repaired, and the migration list is clean.

Remote schema was checked through the app client and now accepts:

- `classes.team_size`
- `classes.team_assignments`

No secrets should be committed. A Supabase personal access token was pasted during setup and should be revoked or rotated after use.

## Safe Backend Procedure

For small additive migrations only:

1. Create a new migration file in `supabase/migrations/`.
2. Review it carefully.
3. Apply it directly with `npm exec --yes supabase -- db query --linked --file <migration-file>`.
4. Mark only that version as applied with `npm exec --yes supabase -- migration repair --status applied <version>`.
5. Verify the schema from the app or SQL.
6. Commit the migration and code together.

Do not mark historical migrations as applied unless their effects have been verified against the remote schema.

For normal future work, use `supabase db push --linked` only after checking `npm exec --yes supabase -- migration list --linked` is clean.

## Session Rule

Before pushing to GitHub:

1. Run `git status --short`.
2. Run the requested verification commands.
3. Confirm backend migrations are either applied or intentionally deferred.
4. Commit code, migrations, and this handoff log together.
