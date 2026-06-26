# Supabase And Data Model

This document describes the Supabase schema, security model, RPC functions, and migration workflow.

## Core Tables

### `profiles`

One row per Supabase Auth user.

Important columns:

- `id`: Auth user ID.
- `full_name`
- `role`: `lead` or `student`.
- `created_at`

Used by onboarding, dashboard, admin panel, and display names.

### `classes`

One row per class workspace.

Important columns:

- `id`
- `lead_id`
- `name`
- `institution`
- `expected_count`
- `invite_code`
- `roster_lock_enabled`
- `identifier_type`: `roll`, `email`, or `id`.
- `identifier_prefix`
- `identifier_suffix_digits`
- `team_size`: 2 to 6.
- `team_assignments`: JSON snapshot of published teams.
- `is_published`
- `created_at`

`team_assignments` is stored on `classes` because there is only one current assignment snapshot per class. This avoids a separate table and duplicate RLS.

### `roster_entries`

Optional locked roster identifiers for a class.

Important columns:

- `class_id`
- `identifier`
- `identifier_type`
- `claimed_by`
- `claimed_at`

Used when a lead enables roster lock.

### `class_members`

Membership rows for joined students.

Important columns:

- `class_id`
- `student_id`
- `display_name`
- `identifier`
- `joined_at`

The `(class_id, student_id)` pair is unique. Identifier duplicate protection is enforced by trigger/RPC logic.

### `survey_responses`

Survey drafts and completed responses.

Important columns:

- `class_id`
- `student_id`
- `answers`: JSON answers.
- `completed`
- `submitted_at`
- `updated_at`

Students can write their own response. Leads can read responses for their classes.

### `match_results`

Per-student published result payloads.

Important columns:

- `class_id`
- `student_id`
- `result_data`: JSON result profile.
- `generated_at`

One row exists per completed student after publish.

### `platform_match_feedback`

Platform-scoped product feedback from students after they review results.

Important columns:

- `class_id`
- `student_id`
- `choice`: `Useful`, `Unsure`, or `Not useful`.
- `created_at`
- `updated_at`

This is separate from `match_results` so class leads do not receive student product feedback. Platform admins can use it for product quality monitoring.

### `platform_admins`

Allowlist for platform admin users.

Important columns:

- `user_id`
- `note`
- `created_at`

### `admin_presence`

Heartbeat table for signed-in user activity.

Important columns:

- `user_id`
- `last_seen_at`
- `last_path`
- `user_agent`

Written through `record_presence`.

### `admin_audit_log`

Admin action log.

Important columns:

- `actor_id`
- `actor_email`
- `target_type`
- `target_id`
- `action`
- `details`
- `created_at`

## Enums

### `app_role`

Values:

- `lead`
- `student`

## Important RPC Functions

### Class Membership

#### `lookup_class_by_code(_code text)`

Returns class join metadata:

- identifier type.
- roster lock flag.
- roll prefix.
- roll suffix digit count.

Used by the join page before the student submits details.

#### `join_class_by_code(_code text, _display_name text, _identifier text)`

Security-definer join function.

Responsibilities:

- Require signed-in user.
- Find class by invite code.
- Normalize identifier according to class settings.
- Validate roster lock when enabled.
- Prevent duplicate identifiers.
- Claim roster entry when applicable.
- Create class membership.
- Create/prepare survey response state.
- Return class join status.

This is the main protection against duplicate join identity.

### Identifier Normalization

#### `normalize_student_identifier(_identifier text)`

Lowercases, trims, and normalizes spacing/dashes.

#### `normalize_roll_prefix(_prefix text)`

Normalizes a roll prefix like `SP25 BCS` into a safe prefix format.

#### `normalize_class_identifier(_class_id uuid, _identifier text)`

Class-aware identifier normalization.

Example:

- Lead config: prefix `SP25-BCS`, suffix digits `3`.
- Student enters `6`.
- Stored identifier becomes `sp25-bcs-006`.

Frontend preview uses the matching TypeScript helper in `src/lib/class-flow.ts`.

### Publishing And Platform Feedback

#### `submit_match_feedback(class_id uuid, choice text)`

Security-definer function that lets a student save platform feedback after verifying they own a result row.

Allowed choices:

- `Useful`
- `Unsure`
- `Not useful`

This writes to `platform_match_feedback`, not to lead-readable `match_results.result_data`.

### Demo Class

#### `setup_demo_class(_lead_id uuid)`

Creates a private demo class for the signed-in lead.

Rules:

- `_lead_id` must equal `auth.uid()`.
- Demo invite code is lead-scoped.
- Only that lead's prior demo class is removed.

### Admin

Admin functions are security-definer functions guarded by `admin_assert()` / platform-admin checks.

Important functions:

- `is_platform_admin(_user_id uuid)`
- `record_presence(_path text, _user_agent text)`
- `admin_get_overview()`
- `admin_search_users(_query text, _limit int)`
- `admin_list_classes(_query text, _limit int)`
- `admin_get_user_detail(_user_id uuid)`
- `admin_get_class_detail(_class_id uuid)`
- `admin_list_audit_log(_limit int)`
- `admin_set_user_role(_user_id uuid, _role app_role)`
- `admin_grant_platform_admin(_user_id uuid, _note text)`
- `admin_revoke_platform_admin(_user_id uuid)`
- `admin_delete_class(_class_id uuid)`
- `admin_delete_user_account(_user_id uuid)`

The frontend never uses a service-role key.

## RLS Model

### Profiles

- Users can read/update/insert their own profile.
- Peers can be read in a published shared class.

### Classes

- Leads manage their own classes.
- Authenticated users can read classes so invite-code flows can work.

### Roster Entries

- Leads manage roster entries for their classes.
- Authenticated users can read/claim through the join flow and RPC safeguards.

### Class Members

- Leads read members in their classes.
- Students read their own membership.
- Students can read peers once a class is published.

### Survey Responses

- Students manage their own response.
- Leads read responses in their classes.

### Match Results

- Students read their own result only when the class is published.
- Leads read/write results in their classes.

### Platform Feedback

- Students can read their own platform feedback row.
- Platform admins can read platform feedback.
- Class leads do not receive platform feedback through the app.
- Student platform feedback is updated through `submit_match_feedback`.

### Admin Tables

- Platform admins can read/manage admin tables according to specific admin policies.
- Users can upsert/update their own presence.

## Migrations

Migrations live in `supabase/migrations`.

Important rule:

Do not edit existing migration files after they have been applied. Add a new migration.

Current notable migrations:

- Initial schema and RLS.
- Atomic class join and roster locking.
- Lead response deletion.
- Demo class RPC.
- Team size.
- Team assignment snapshot on classes.
- Policy reconciliation.
- Demo RPC restriction.
- Feedback RPC.
- Platform feedback table.
- Per-lead demo classes.
- Platform admin control panel.
- Roll-number format normalization.

## Safe Migration Workflow

For additive changes:

1. Create a new migration file.
2. Review SQL carefully.
3. Run local checks.
4. Apply to Supabase.
5. Repair migration status only for the applied migration if needed.
6. Regenerate or update TypeScript database types.
7. Run:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Supabase CLI Notes

For non-interactive environments:

```bash
export SUPABASE_ACCESS_TOKEN="..."
export SUPABASE_DB_PASSWORD="..."
npm exec --yes supabase -- link --project-ref <project-ref>
npm exec --yes supabase -- db push --linked
```

Never commit these values.

## TypeScript Database Types

The generated/maintained type file is:

```text
src/integrations/supabase/types.ts
```

Update it whenever schema changes affect frontend types.
