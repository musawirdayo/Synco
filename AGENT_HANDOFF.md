# Agent Handoff

Last updated: 2026-06-24

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

## Verification Already Run

These passed after the feature work:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm exec --yes supabase -- migration list --linked` shows every local migration version matched on remote.
- `npm exec --yes supabase -- db push --linked --dry-run` reports `Remote database is up to date.`

Manual end-to-end verification in `npm run dev` is still TODO unless a later log entry says otherwise.

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
