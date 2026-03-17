begin;

update shop_items
set
  price = 35,
  description = 'Recupera 50% do HP/Sanidade instantaneamente.',
  type = 'consumable',
  effect_code = 'HEAL_PERCENT_50',
  icon = 'Coffee',
  min_level = 1,
  duration_minutes = null,
  metadata = '{}'::jsonb,
  stackable = true,
  target_category = null
where effect_code = 'HEAL_PERCENT_50';

update shop_items
set
  price = 120,
  description = 'Te tira do proximo sorteio de Balde.',
  type = 'consumable',
  effect_code = 'SKIP_BALDE_NEXT',
  icon = 'Shield',
  min_level = 1,
  duration_minutes = null,
  metadata = '{}'::jsonb,
  stackable = true,
  target_category = 'balde'
where effect_code = 'SKIP_BALDE_NEXT';

update shop_items
set
  price = 180,
  description = 'Aumenta seus ganhos de SetorCoins por 1 hora.',
  type = 'passive',
  effect_code = 'COIN_MAGNET',
  icon = 'Coins',
  min_level = 2,
  duration_minutes = 60,
  metadata = '{"multiplier": 1.5}'::jsonb,
  stackable = false,
  target_category = null
where name = 'Imã de Moedas';

update shop_items
set
  price = 180,
  description = 'Se voce for sorteado na Agua, tenta terceirizar o turno para outro participante.',
  type = 'rare',
  effect_code = 'OUTSOURCE_AGUA',
  icon = 'RefreshCw',
  min_level = 3,
  duration_minutes = null,
  metadata = '{}'::jsonb,
  stackable = true,
  target_category = 'agua'
where effect_code = 'OUTSOURCE_AGUA';

insert into shop_items (
  id,
  name,
  description,
  price,
  type,
  effect_code,
  icon,
  min_level,
  duration_minutes,
  metadata,
  stackable,
  target_category
)
select
  gen_random_uuid(),
  'Band-Aid Corporativo',
  'Recupera 100 HP instantaneamente.',
  55,
  'consumable',
  'HEAL_100',
  'HeartPulse',
  1,
  null,
  '{}'::jsonb,
  true,
  null
where not exists (
  select 1 from shop_items where name = 'Band-Aid Corporativo'
);

insert into shop_items (
  id,
  name,
  description,
  price,
  type,
  effect_code,
  icon,
  min_level,
  duration_minutes,
  metadata,
  stackable,
  target_category
)
select
  gen_random_uuid(),
  'Capa de Fuga',
  'Aumenta sua chance de escapar de sorteios de risco por 24 horas.',
  60,
  'consumable',
  'RELIEF_LUCK_BOOST',
  'Shield',
  1,
  null,
  '{"luckBonus": 0.08, "duration_hours": 24}'::jsonb,
  true,
  null
where not exists (
  select 1 from shop_items where name = 'Capa de Fuga'
);

insert into shop_items (
  id,
  name,
  description,
  price,
  type,
  effect_code,
  icon,
  min_level,
  duration_minutes,
  metadata,
  stackable,
  target_category
)
select
  gen_random_uuid(),
  'Imã de Moedas Lite',
  'Aumenta modestamente seus ganhos de SetorCoins por 30 minutos.',
  95,
  'passive',
  'COIN_MAGNET',
  'Coins',
  1,
  30,
  '{"multiplier": 1.2}'::jsonb,
  false,
  null
where not exists (
  select 1 from shop_items where name = 'Imã de Moedas Lite'
);

insert into shop_items (
  id,
  name,
  description,
  price,
  type,
  effect_code,
  icon,
  min_level,
  duration_minutes,
  metadata,
  stackable,
  target_category
)
select
  gen_random_uuid(),
  'Procuração do Pão',
  'Se voce for sorteado no Pao, transfere o problema para outro participante.',
  140,
  'rare',
  'TRANSFER_PAO',
  'ScrollText',
  2,
  null,
  '{}'::jsonb,
  true,
  'pao'
where not exists (
  select 1 from shop_items where name = 'Procuração do Pão'
);

insert into shop_items (
  id,
  name,
  description,
  price,
  type,
  effect_code,
  icon,
  min_level,
  duration_minutes,
  metadata,
  stackable,
  target_category
)
select
  gen_random_uuid(),
  'Vale Hora Extra',
  'No proximo sorteio Solo, voce recebe bonus extra de XP e moedas.',
  160,
  'rare',
  'SOLO_REWARD_BOOST',
  'BriefcaseBusiness',
  1,
  null,
  '{"xpBonus": 10, "coinBonus": 6}'::jsonb,
  true,
  null
where not exists (
  select 1 from shop_items where name = 'Vale Hora Extra'
);

commit;
