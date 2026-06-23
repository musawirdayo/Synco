alter table public.classes
  add column team_size integer not null default 4;

alter table public.classes
  add constraint classes_team_size_range check (team_size between 2 and 6);
