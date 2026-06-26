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

## 2026-06-25 Matching Algorithm V2 Slice

Implemented locally from `deep-research-report.md`:

- Added V2 pair helpers in `src/lib/synco.ts`:
  - `pairSafetyScore`
  - `pairRiskScore`
  - `pairIsRisky`
  - `matchProofs`
  - `riskProofs`
  - `teamBreakdown`
- Kept `matchBreakdown()` and existing scoring weights stable for backward compatibility.
- Updated `formTeams()` so adding a student to a team is judged by whole-team quality, not only average pair score.
- Team quality now scores minimum pair safety, average pair fit, logistics, goal alignment, skill coverage, role coverage, role balance, isolation, and request satisfaction.
- Saved team assignments now include `quality`, `quality_score`, and richer rationale text.
- Fixed the result-generation bug where small classes could show the same peer in both top matches and watch/avoid lists.
  - Lists are now split into separate pools with no duplicate student across the two sections.
  - The product still aims for up to 5 top matches and up to 5 watch-outs where class size allows.
- Student results now show proof bullets on strong-match cards and watch/avoid cards, plus team-quality proof metrics on the assigned team card.
- Added tests for proof generation, risky pair detection, and the duplicate-role problem: balanced teams must score higher than same-role/same-strength teams when logistics are similar.

Verification passed after this slice:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (78 passing)
- `npm run build`

Next recommended Matching V2 work:

- Replace the current greedy team builder with a generated-team-candidate + local-swap solver.
- Redesign the survey questions around behavior/work preferences from the research report.
- Add scenario fixtures for class sizes 6, 7, and 24, plus hard-to-place students and friend-request conflicts.

## 2026-06-25 Matching Algorithm V2 Phase 2

Implemented locally:

- Replaced the purely sequential team builder with a two-mode team solver:
  - Small classes use exact search across valid team-size patterns.
  - Larger classes use a bounded candidate-team heuristic so publish stays fast.
- Team-size patterns now handle uneven classes more naturally, for example target size 4 with 7 students becomes `4 + 3` instead of forcing leftovers into bad shapes.
- Added a local swap-polish pass that improves full-class assignments after initial solving.
- Kept forced mutual-request groups protected so the swap pass cannot separate hard-honored mutual requests.
- Large-class solving is bounded to the highest-priority patterns to avoid slow publishes/tests.
- Added scenario tests for:
  - 7-person class with target size 4 -> `4 + 3`
  - 24-person class with target size 4 -> six teams of 4
  - avoiding a team of three duplicate Reliable Finisher roles when balanced alternatives exist

Verification passed after this phase:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (81 passing)
- `npm run build`

Next recommended Matching V2 work:

- Survey V2: replace/reshape questions around behavior, work rhythm, thinking style, reliability, communication, and skill complementarity from `deep-research-report.md`.
- Add more scenario fixtures for hard-to-place students, friend-request conflicts, blocked-pair-heavy classes, and many missing answers.
- Consider a teacher review UI for low-confidence teams before publish.

## 2026-06-25 Survey V2 Matching Signals

Implemented locally:

- Expanded the optional survey detail flow from broad academic/logistics fields into behavior-first matching signals:
  - work style
  - planning style
  - deadline behavior
  - ambiguity response
  - working mode
  - check-in rhythm
  - response expectation
  - delivery reliability
  - preferred team role
  - role flexibility
  - project outcome
- Kept these as JSON survey-answer fields, so no Supabase migration was required.
- Removed the old gender/privacy preference from the active survey detail flow.
- Updated `src/lib/synco.ts` so the matching engine uses the new fields in:
  - study-style compatibility
  - goal alignment
  - risk scoring
  - proof/rationale bullets
  - work-style meters
  - role contribution
  - team skill/role coverage
- Added tests proving the new communication/reliability fields affect pair scoring and the role-flexibility field improves team-quality scoring.

Verification passed after this slice:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (83 passing)
- `npm run build`
- `git diff --check`

Next recommended Matching V2 work:

- Add scenario fixtures for hard-to-place students, friend-request conflicts, blocked-pair-heavy classes, and many missing answers.
- Improve student results copy so each suggested/avoided peer gets clearer, punchier plain-language evidence.
- Consider a teacher review UI for low-confidence teams before publish.

## 2026-06-25 Results V2 Student Explanation Pass

Implemented locally:

- Upgraded `src/routes/results.tsx` so published student results explain the data more clearly without requiring a new publish:
  - top-match cards now show a stronger headline, why the person matters, proof bullets, what to agree on first, and the first move
  - watch/avoid cards now show a likely failure mode, friend-reality cards stay visually distinct and sorted first, and risky pairs get clearer next-step copy
  - the peer detail panel now includes the same practical upside/failure-mode explanation
  - the assigned team card now highlights the team's best signal, weak spot, proof from roles/coverage, and top quality metrics
- Kept the existing top-5 match and watch/avoid sections in place.
- Added form-team scenario tests for:
  - hard-to-place student assignment
  - mutual request blocked by a do-not-pair conflict
  - many missing answers with finite team scores and no dropped students

Verification passed after this slice:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (86 passing)
- `npm run build`
- `git diff --check`

Next recommended Matching V2 work:

- Add a teacher-facing low-confidence team review panel before publish.
- Add analytics for which match reasons students click/expand most, if the product needs evidence that the result page is engaging.
- Consider regrouping the long survey into fewer visual screens once enough real responses reveal which fields carry the most signal.

## 2026-06-25 Core Question Copy V2

Implemented locally:

- Rewrote the 22 core slider questions in `src/lib/questions.ts` to be more practical, student-friendly, and project/team-behavior focused.
- Kept the stable `q1` through `q22` IDs and low/high directions, so existing JSON survey-answer storage and scoring logic do not require a migration.
- Updated the survey guide copy to describe the flow as quick behavior questions plus project details.
- Updated internal `src/lib/synco.ts` comments where the old question labels no longer matched the improved wording.
- Added `src/lib/questions.test.ts` to guard the stable question IDs and keep protected-trait questions out of the core survey.

Verification passed after this slice:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (88 passing)
- `npm run build`
- `git diff --check`

Next recommended survey work:

- Regroup the 22 core sliders into fewer multi-question screens so the survey feels shorter without losing signal.
- Consider marking new submissions with a survey schema version in the answers JSON before making larger semantic changes.
- Move the most predictive detail fields into the required flow once real class data shows which ones carry the most signal.

## 2026-06-25 Student Results Profile Redesign

Implemented locally:

- Rebuilt `src/routes/results.tsx` around a profile-style layout:
  - left rail shows the student's result profile, archetype, report stats, partial-data notice, and work-style meters
  - main column opens with the assigned team as the headline result
  - best collaborators are shown as detailed profile cards with score rings, proof bullets, breakdown bars, and next-step chips
  - watch-outs are shown as distinct risk cards, with friend-reality cards still visually emphasized and sorted first
  - feedback is kept as a clean final panel using the existing feedback RPC flow
- Removed the old tabbed detail/overview results layout from the source after replacing it.
- Kept data fetching, team assignment lookup, match scoring output shape, feedback RPC behavior, and published-result logic unchanged.

Verification passed after this slice:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (88 passing)
- `npm run build`
- `git diff --check`
- Local dev server is running at `http://127.0.0.1:5173/`; `GET /results` returns `200` from the dev server. Full authenticated visual verification still needs a logged-in student with published data.

Next recommended results-page work:

- Add an authenticated visual QA pass with a real/demo student result once credentials are approved for use.
- Consider extracting the new result panels into smaller components if `results.tsx` grows again.

## 2026-06-25 Results UX + Matching Correction Slice

Implemented locally:

- Fixed the weird results-page scrolling by removing the sticky left profile rail in `src/routes/results.tsx`.
- Replaced the tiny/truncated 5-column percentage bars with readable full-width breakdown bars.
- Made the assigned-team card more explicit for 3/4/5+ person teams:
  - shows team number, member count, target team size, average pair fit, and teammate names
  - still lists every member in the assigned team
- Added a student-facing comparison/search panel on results:
  - searches visible classmate names and visible identifiers/roll numbers
  - shows detailed comparison, score ring, factor bars, upside, difficulty, and first agreement point
  - falls back to existing match/watch data for old results
- Updated publish in `src/routes/class.$id.tsx` to store `comparisonPeers` in each student's result JSON for future full-class search after republish.
- Added `publicPeerIdentifier()` in `src/lib/class-helpers.ts` so hidden-identity classmates do not expose identifiers in search.
- Deduped stale result displays so the same classmate is not shown as both a best collaborator and a watch-out unless there is a real risk reason.
- Adjusted `src/lib/synco.ts` scoring so:
  - complementary skill coverage has more weight
  - duplicated strengths are no longer over-rewarded
  - shared weak areas reduce score more strongly
  - pairs with duplicate skills and no coverage receive a final-score redundancy penalty
- Updated tests so complementary coverage must beat duplicate-strength pairing.

Verification passed after this slice:

- `npm test -- --run src/lib/synco.test.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (88 passing)
- `npm run build`
- `git diff --check`
- Local dev server is still running at `http://127.0.0.1:5173/`; `GET /results` returns `200`.

Important caveat:

- Existing published classes need to be republished before students get full-class comparison search and the updated matching scores. Old result JSON can only search the peers already present in top/watch lists.

## 2026-06-25 Team Safety Review Slice

Commit in progress:

- Adds `needsReview` and `reviewFlags` to `TeamQualityBreakdown`.
- `teamBreakdown()` now flags weak inside-team safety, meeting-time fit, goal alignment, skill coverage, role balance, and isolated members.
- Team quality score now takes a bounded review penalty, and assignment comparison prefers fewer severe/review teams before tiny score differences.
- Teacher class page now surfaces a warning above Assigned Teams and shows per-team review flags plus compact metrics.
- Existing published classes need a republish before stored `team_assignments` include the new review flags.

Verified before commit:

- `npm test -- --run src/lib/synco.test.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`
- Local dev server still responds at `http://127.0.0.1:5173/results`.

Next recommended matching work:

- Move from the current TypeScript heuristic toward the deep-research report's constraint/optimization model: pair matrices, hard safety floors, team-size pattern solving, then local swap polishing.
- Add a teacher pre-publish review step if the lead should approve flagged teams before students see them.

## 2026-06-25 Results Compatibility Proofs

Implemented and ready to push:

- `src/routes/results.tsx` now renders a reusable Compatibility proof panel on match cards and in the Compare panel.
- Proofs are classified into meeting, skill, work-style, effort, and course evidence.
- New result JSON uses stored `proofs`; older result JSON falls back to positive breakdown signals so the panel still appears without republishing.
- The old plain proof bullet list on match cards was replaced with compact evidence cards showing labels, detail, and the relevant score when available.

Verified:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`

## 2026-06-26 Premium Results Cleanup

Implemented and ready to push:

- `src/routes/results.tsx` now uses lighter proof chips instead of boxed proof cards.
- Match cards were redesigned as cleaner report entries: verdict, proof chips, why it works, first move, and collapsible detailed signals.
- Watch-out cards now read more like risk memos, with stronger warning/friend treatment and collapsible risk signals.
- Compare panel was flattened so score breakdowns live behind a details control instead of dominating the first view.
- Work style panel was simplified into divided profile rows rather than five nested mini-cards.
- `src/lib/synco.ts` removes duplicate/large-class polishing work so the 24-person formTeams test no longer hits Vitest's 5s timeout.

Verified:

- `npm test -- --run src/lib/synco.test.ts -t "scales a 24-person class"`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`
- Local dev server still responds at `http://127.0.0.1:5173/results`.

## 2026-06-26 Landing Algorithm Story

Implemented and ready to push:

- `src/routes/index.tsx` now markets Synco around the upgraded matching engine instead of only basic team creation.
- Hero copy now says Synco creates smarter project teams with reasons included.
- Matching section now highlights meeting reality, complementary strengths, thinking/work style, hard rules and requests, team safety checks, and proof-based results.
- Added landing cards for team quality, student match/watch-out guidance, and lead review flags.
- FAQ now clarifies that Synco does not simply group similar students together.

Verified:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`
- Local dev server responds at `http://127.0.0.1:5173/`.

## 2026-06-26 Landing Reveal Hydration Fix

Implemented and ready to push:

- `src/components/animations/reveal.tsx` no longer depends on Framer's `whileInView` shortcut for landing reveals.
- Added an explicit `IntersectionObserver` hook with a first-frame visibility check so reveal/stagger animations initialize on hard page load, not only after client-side navigation away and back.
- Keeps reduced-motion support and existing Reveal/StaggerContainer API unchanged.

Verified:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`
- Local dev server responds at `http://127.0.0.1:5173/`.

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

## 2026-06-26 Peer Reference Hardening

Implemented and ready to push:

- Added a class-aware peer reference resolver in `src/lib/synco.ts`.
- Free-text friend/request/avoid entries now resolve against the full submitted class roster when publishing/team-forming:
  - exact student IDs and identifiers/roll numbers are safest;
  - capitalization, spacing, punctuation, and comma/semicolon/newline separators are handled;
  - unique names still work;
  - duplicate-name entries are treated as ambiguous and ignored instead of guessing the wrong student.
- Added support for future exact ID-backed survey answers:
  - `doNotPairWithIds`
  - `wantToWorkWithIds`
  - `friendsInClassIds`
- `formTeams`, team quality scoring, teacher risk pairs, publish-time ranked peer lists, friend flags, and friend risk messages now use the same class-aware signal map.
- `src/routes/class.$id.tsx` now warns the lead in the decision dashboard, printable report, publish confirmation, and post-publish notice if any friend/request/avoid entry is ambiguous.
- Survey helper text now tells students to use roll numbers/identifiers when names repeat.
- Added tests for identifier case-insensitivity, duplicate-name ambiguity, selected-ID disambiguation, mutual request IDs, and friend flag IDs.

Verified:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (93 passing)
- `npm run build`
- `git diff --check`

## 2026-06-26 Roll Number Format Normalization

Implemented:

- Added `identifier_prefix` and `identifier_suffix_digits` to `classes` via `20260626001000_add_roll_number_format.sql`.
- Added server-side `normalize_class_identifier(class_id, identifier)` and `normalize_roll_prefix(prefix)`.
- Reworked `lookup_class_by_code` to return roll format metadata.
- Reworked `join_class_by_code`, roster triggers, and class-member triggers so roster claims and duplicate checks use class-aware identifier normalization.
- Class creation now asks for identifier type and roll format even when roster lock is off.
- Leads can set a format like prefix `SP25-BCS` + ending digits `3`; students may enter `006`, `6`, or `sp25bcs006`, and Synco treats all as `SP25-BCS-006`.
- If a class only uses numeric endings, the lead leaves prefix blank and keeps ending digits, e.g. `006`.
- Join page now shows a simpler "Roll number ending" field when a prefix exists and previews how Synco will read the entered value.
- Added `src/lib/class-flow.test.ts` coverage for dash/case normalization, prefix handling, suffix-only roll numbers, and examples.

Remote backend:

- Applied `20260626001000_add_roll_number_format.sql` to Supabase with `supabase db query --linked --file ...`.
- Repaired only migration version `20260626001000` as applied.
- `supabase migration list --linked` is clean after the repair.

Verified:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (99 passing)
- `npm run build`

## 2026-06-26 Student Account Join Flow

Implemented:

- Join links now show an explicit account step for signed-out students instead of silently redirecting to login.
- Students can choose "Create student account" or "I already have an account" from the class link.
- The invite code is still remembered through signup/login, so returning students can open results from another device by signing in with the same email and password.
- Signup from a class link sets the new profile role to `student` and returns directly to the class join flow.
- Login/signup copy now explains the device-independent account behavior when reached from a class link.
- Duplicate roll-number errors now tell students to sign in with the first account they used instead of creating another account.

Verified:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (99 passing)
- `npm run build`
- `git diff --check`

## 2026-06-26 Platform Documentation

Added a proper documentation set:

- `README.md` as the main entrypoint.
- `docs/PRODUCT_GUIDE.md` for roles, flows, route map, and feature status.
- `docs/ARCHITECTURE.md` for frontend/backend structure and data flows.
- `docs/SUPABASE_AND_DATA_MODEL.md` for schema, RLS, RPCs, and migration workflow.
- `docs/MATCHING_ENGINE.md` for scoring, peer references, team formation, and result payloads.
- `docs/OPERATIONS.md` for setup, env vars, checks, deploy, Supabase CLI, and admin setup.
- `docs/SECURITY_AND_PRIVACY.md` for auth, privacy, admin access, key handling, and incident checklist.

Verified:

- `npx prettier --write README.md docs/*.md AGENT_HANDOFF.md`
- `git diff --check`
- Basic secret scan for pasted Supabase/user credentials in the new docs.
