begin;

alter table profiles
  add column if not exists luck numeric(5,4) not null default 0,
  add column if not exists titles jsonb not null default '[]'::jsonb,
  add column if not exists passive_coin_multiplier numeric(6,2) not null default 1,
  add column if not exists temporary_coin_multiplier numeric(6,2) not null default 1,
  add column if not exists exhaustion_threshold numeric(5,2) not null default 0.30,
  add column if not exists exhaustion_penalty_multiplier numeric(5,2) not null default 0.50;

alter table profiles
  alter column inventory set default '[]'::jsonb,
  alter column active_buffs set default '[]'::jsonb;

update profiles
set
  inventory = coalesce(inventory, '[]'::jsonb),
  active_buffs = coalesce(active_buffs, '[]'::jsonb),
  titles = coalesce(titles, '[]'::jsonb),
  passive_coin_multiplier = coalesce(passive_coin_multiplier, 1),
  temporary_coin_multiplier = coalesce(temporary_coin_multiplier, 1),
  exhaustion_threshold = coalesce(exhaustion_threshold, 0.30),
  exhaustion_penalty_multiplier = coalesce(exhaustion_penalty_multiplier, 0.50),
  luck = coalesce(luck, 0);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_class_check'
  ) then
    alter table profiles
      add constraint profiles_class_check
      check (class in ('novato', 'ladino', 'guerreiro', 'mago', 'clerigo'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_inventory_array_check'
  ) then
    alter table profiles
      add constraint profiles_inventory_array_check
      check (jsonb_typeof(inventory) = 'array');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_active_buffs_array_check'
  ) then
    alter table profiles
      add constraint profiles_active_buffs_array_check
      check (jsonb_typeof(active_buffs) = 'array');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_titles_array_check'
  ) then
    alter table profiles
      add constraint profiles_titles_array_check
      check (jsonb_typeof(titles) = 'array');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_luck_range_check'
  ) then
    alter table profiles
      add constraint profiles_luck_range_check
      check (luck >= 0 and luck <= 1);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_coin_multiplier_check'
  ) then
    alter table profiles
      add constraint profiles_coin_multiplier_check
      check (
        passive_coin_multiplier >= 0
        and temporary_coin_multiplier >= 0
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_exhaustion_values_check'
  ) then
    alter table profiles
      add constraint profiles_exhaustion_values_check
      check (
        exhaustion_threshold >= 0
        and exhaustion_threshold <= 1
        and exhaustion_penalty_multiplier >= 0
        and exhaustion_penalty_multiplier <= 1
      );
  end if;
end $$;

alter table shop_items
  add column if not exists duration_minutes integer,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists stackable boolean not null default true,
  add column if not exists target_category text;

alter table shop_items
  alter column min_level set default 1;

update shop_items
set
  metadata = coalesce(metadata, '{}'::jsonb),
  stackable = coalesce(stackable, true),
  min_level = coalesce(min_level, 1);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shop_items_type_check'
  ) then
    alter table shop_items
      add constraint shop_items_type_check
      check (type in ('consumable', 'passive', 'rare'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'shop_items_target_category_check'
  ) then
    alter table shop_items
      add constraint shop_items_target_category_check
      check (
        target_category is null
        or target_category in ('pao', 'agua', 'balde', 'geral')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'shop_items_metadata_object_check'
  ) then
    alter table shop_items
      add constraint shop_items_metadata_object_check
      check (jsonb_typeof(metadata) = 'object');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'shop_items_min_level_check'
  ) then
    alter table shop_items
      add constraint shop_items_min_level_check
      check (min_level >= 1);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'shop_items_duration_check'
  ) then
    alter table shop_items
      add constraint shop_items_duration_check
      check (duration_minutes is null or duration_minutes > 0);
  end if;
end $$;

create index if not exists profiles_level_idx on profiles (level desc, xp desc);
create index if not exists profiles_class_idx on profiles (class);
create index if not exists shop_items_effect_code_idx on shop_items (effect_code);
create index if not exists battle_logs_actor_created_at_idx on battle_logs (primary_actor_id, created_at desc);

commit;
