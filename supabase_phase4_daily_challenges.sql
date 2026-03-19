begin;

alter table profiles
  add column if not exists daily_challenge_state jsonb not null default '{}'::jsonb;

update profiles
set daily_challenge_state = coalesce(daily_challenge_state, '{}'::jsonb);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_daily_challenge_state_object_check'
  ) then
    alter table profiles
      add constraint profiles_daily_challenge_state_object_check
      check (jsonb_typeof(daily_challenge_state) = 'object');
  end if;
end $$;

commit;
