begin;

create extension if not exists pgcrypto;

alter table profiles
  add column if not exists stat_points integer not null default 0,
  add column if not exists stat_foco integer not null default 0,
  add column if not exists stat_resiliencia integer not null default 0,
  add column if not exists stat_networking integer not null default 0,
  add column if not exists stat_malandragem integer not null default 0;

update profiles
set
  stat_points = coalesce(stat_points, 0),
  stat_foco = coalesce(stat_foco, 0),
  stat_resiliencia = coalesce(stat_resiliencia, 0),
  stat_networking = coalesce(stat_networking, 0),
  stat_malandragem = coalesce(stat_malandragem, 0);

update profiles
set stat_points = greatest(
  (greatest(level, 1) - 1) * 3
  - coalesce(stat_foco, 0)
  - coalesce(stat_resiliencia, 0)
  - coalesce(stat_networking, 0)
  - coalesce(stat_malandragem, 0),
  0
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_stat_values_check'
  ) then
    alter table profiles
      add constraint profiles_stat_values_check
      check (
        stat_points >= 0
        and stat_foco >= 0
        and stat_resiliencia >= 0
        and stat_networking >= 0
        and stat_malandragem >= 0
      );
  end if;
end $$;

alter table profiles
  drop constraint if exists profiles_class_check;

alter table profiles
  add constraint profiles_class_check
  check (
    class in (
      'novato',
      'aprendiz_guerreiro',
      'aprendiz_mago',
      'aprendiz_ladino',
      'aprendiz_clerigo',
      'guerreiro',
      'mago',
      'ladino',
      'clerigo'
    )
  );

create table if not exists roadmap (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'pending',
  created_by uuid references profiles(id) on delete set null,
  votes integer not null default 0,
  created_at timestamp with time zone not null default now()
);

alter table roadmap
  alter column id set default gen_random_uuid(),
  alter column votes set default 0,
  alter column status set default 'pending',
  alter column created_at set default now();

update roadmap
set
  votes = coalesce(votes, 0),
  status = coalesce(status, 'pending'),
  created_at = coalesce(created_at, now());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'roadmap_status_check'
  ) then
    alter table roadmap
      add constraint roadmap_status_check
      check (status in ('pending', 'in_progress', 'done'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'roadmap_votes_check'
  ) then
    alter table roadmap
      add constraint roadmap_votes_check
      check (votes >= 0);
  end if;
end $$;

alter table roadmap disable row level security;

create index if not exists roadmap_status_created_at_idx
  on roadmap (status, created_at desc);

create index if not exists roadmap_created_by_idx
  on roadmap (created_by);

commit;
