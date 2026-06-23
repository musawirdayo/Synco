alter table public.classes
  add column team_assignments jsonb;

comment on column public.classes.team_assignments is
  'Stores one class-level team assignment snapshot on classes instead of a separate class_teams table because assignments are one-per-class and existing class lead/member policies already cover publish writes and student reads without duplicate RLS.';
