# Operations

This guide covers local setup, commands, deployments, migrations, and admin setup.

## Requirements

- Node `>=22.12.0 <23`
- npm
- Supabase project
- GitHub repository
- Deployment provider such as Vercel

## Install

```bash
npm install
```

## Environment Variables

Minimum frontend variables:

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

Accepted aliases are documented in [README](../README.md).

For Supabase CLI in non-interactive environments:

```bash
SUPABASE_ACCESS_TOKEN="..."
SUPABASE_DB_PASSWORD="..."
```

Do not commit these values.

## Local Development

```bash
npm run dev
```

The dev server will print the localhost URL.

## Verification Commands

Use these before commits that change code or schema:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
git diff --check
```

For documentation-only changes, `npm run build` is not always required, but running Prettier is still useful.

## Formatting

```bash
npm run format
```

For focused docs formatting:

```bash
npx prettier --write README.md docs/*.md AGENT_HANDOFF.md
```

## Deployment

The repo is designed to deploy from GitHub. Vercel should be configured with:

- Supabase URL.
- Supabase publishable/anon key.
- Node version compatible with `package.json`.

After pushing to `main`, Vercel should build from GitHub.

Build command:

```bash
npm run build
```

## Supabase Linking

```bash
export SUPABASE_ACCESS_TOKEN="..."
npm exec --yes supabase -- login --token "$SUPABASE_ACCESS_TOKEN"
npm exec --yes supabase -- link --project-ref <project-ref>
```

If the CLI asks for a database password in CI:

```bash
export SUPABASE_DB_PASSWORD="..."
npm exec --yes supabase -- link --project-ref <project-ref>
```

## Applying Migrations

Normal path:

```bash
npm exec --yes supabase -- migration list --linked
npm exec --yes supabase -- db push --linked
```

For a single reviewed migration file:

```bash
npm exec --yes supabase -- db query --linked --file supabase/migrations/<file>.sql
npm exec --yes supabase -- migration repair --status applied <version>
```

Only repair a migration after verifying it was actually applied.

## Regenerating Supabase Types

If available in your setup:

```bash
npm exec --yes supabase -- gen types typescript --linked > src/integrations/supabase/types.ts
```

If manual updates are needed, keep them consistent with the SQL schema.

## First Admin Setup

Create an account normally first. Then run SQL in Supabase SQL editor:

```sql
insert into public.platform_admins (user_id, note)
select id, 'founder'
from auth.users
where email = 'your-email@example.com';
```

Then sign in and open `/admin`.

The dashboard also shows `Master Control` only when `is_platform_admin` returns true.

## Demo Class

Lead dashboard includes `Set up demo class`.

The demo RPC:

- Requires `_lead_id = auth.uid()`.
- Creates a private demo for that lead.
- Uses a deterministic lead-scoped invite code.
- Does not clobber other leads' demo classes.

## Common Troubleshooting

### "Missing Supabase environment variable"

Add URL and publishable key in local `.env` and deployment environment variables.

### Student says roll number already exists

They probably joined earlier using a different device/account. Tell them to sign in with the original email/password, or have the class lead/admin inspect the membership.

### Results do not show

Check:

- Student completed survey.
- Class is published.
- `match_results` row exists for that student.
- Student is signed into the same account that joined the class.
- Active class storage points to the correct class.

### Feedback does not save

Check that migration `20260624004000_add_submit_match_feedback_rpc.sql` is applied and that the frontend calls `submit_match_feedback`.

### Admin panel denied

Check:

- User is signed in.
- User exists in `platform_admins`, or Auth app metadata grants platform admin.
- Admin migrations are applied.

### Join code works locally but not on Vercel

Check deployment env vars and rebuild. The frontend requires Supabase env vars at build/runtime.

## Commit Procedure

Before pushing:

1. `git status --short`
2. Run relevant verification commands.
3. Confirm migrations are applied or intentionally deferred.
4. Update docs or `AGENT_HANDOFF.md` if the behavior changed.
5. Commit.
6. Push to GitHub.
