# Security And Privacy

Synco handles student names, class membership, survey answers, match results, and admin data. Treat it as sensitive education data.

## Auth Model

Synco uses Supabase email/password auth.

Accounts are shared across devices. A student should create one account and keep using it. Class membership and results are tied to `auth.users.id`, not to local browser storage.

Local storage is used only for convenience:

- Active class ID.
- Pending join code.

It is not the source of truth for identity.

## Key Handling

Safe for frontend:

- Supabase publishable key.
- Supabase anon key.

Never commit:

- Supabase personal access token.
- Database password.
- Service-role key.
- User passwords.
- Admin credentials.

If any secret is pasted into a chat or terminal history, rotate it.

## Row Level Security

RLS is enabled on the main application tables:

- `profiles`
- `classes`
- `roster_entries`
- `class_members`
- `survey_responses`
- `match_results`
- Admin tables

Use RLS and RPCs together. Do not bypass with service-role keys in the frontend.

## Lead Access

Class leads can:

- Manage their own classes.
- Read class members.
- Read class survey responses.
- Publish match results.
- Delete their classes.
- View full roster details for their own classes.

Leads should not see unrelated classes unless they are platform admins.

## Student Access

Students can:

- Read their own membership.
- Write their own survey.
- Read their own results after publish.
- Update their own feedback through `submit_match_feedback`.
- See classmates only as allowed by publish/privacy behavior.

Students should not directly update match results.

## Platform Admin Access

Platform admins can inspect and control the full platform through RPCs.

Admin powers include:

- User search.
- Class search.
- Raw detail inspection.
- Role changes.
- Admin grants/revokes.
- User deletion.
- Class deletion.

Admin access is intentionally powerful. Grant it sparingly.

## Admin Presence

Signed-in users periodically call `record_presence` from the root route.

Stored data:

- User ID.
- Last seen time.
- Last path.
- User agent.

This powers the admin "active now" display.

## Survey Privacy

Survey answers are used for matching. Raw answers are not meant to be shown to classmates.

Student-facing result text is privacy-filtered using helpers from `class-helpers.ts`.

Privacy modes:

- Show my name in results.
- Show name but keep reasons general.
- Lead introduction only.

Leads still see full details for class operations.

## Roster Privacy

The roster route hides names and submission status from other students according to privacy settings. The class lead still sees full roster detail.

## Friend And Avoid Fields

Free-text peer fields can contain sensitive social information.

Rules:

- `doNotPairWith` is treated as a hard constraint.
- `wantToWorkWith` is forced only when mutual, up to team size.
- `friendsInClass` can trigger a private Friend Reality Check message for the student who flagged the friend.
- Ambiguous names are ignored instead of guessed.
- Students should use roll numbers/identifiers when names repeat.

## Error Handling

Do not show stack traces or raw database errors to end users.

Current error boundaries log errors to the console and show friendly generic messages.

When handling Supabase calls:

- Check `error`.
- Log technical details to console.
- Show safe user-facing messages.

## Password Reset

Password reset flow:

1. User requests reset at `/auth/forgot-password`.
2. Supabase sends recovery link.
3. Link redirects to `/auth/reset-password`.
4. User enters and confirms a new password.
5. The route calls `supabase.auth.updateUser({ password })`.
6. User is redirected to `/dashboard`.

## Incident Checklist

If sensitive data or credentials are exposed:

1. Revoke/rotate the secret immediately.
2. Check Git history and deployment variables.
3. Review Supabase Auth logs and SQL logs where available.
4. Check admin audit log.
5. Remove exposed value from docs/code/chat handoff if possible.
6. Redeploy with fresh values.

## Security Review Hotspots

Review carefully when changing:

- `supabase/migrations/*`
- `src/routes/admin.tsx`
- `src/routes/class.$id.tsx`
- `src/routes/results.tsx`
- `src/routes/join_.$code.tsx`
- `src/lib/synco.ts`
- `src/integrations/supabase/client.ts`

## Recommended Future Hardening

- Add more Zod validation around auth, survey, and RPC payloads.
- Standardize all Supabase calls through a safe wrapper.
- Add rate limiting or abuse protection around invite-code attempts if traffic grows.
- Add admin export audit entries.
- Add pagination to admin/class queries for large datasets.
- Consider separating admin operations into a dedicated server-only layer if the product grows.
