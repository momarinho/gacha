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
  metadata = '{"activation": "active", "multiplier": 1.5}'::jsonb,
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
  metadata = '{"activation": "active"}'::jsonb,
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
  '{"activation": "active"}'::jsonb,
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
  '{"activation": "active", "luckBonus": 0.08, "duration_hours": 24}'::jsonb,
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
  'Crachá de Prioridade',
  'Aumenta levemente sua chance de escapar de sorteios de risco por 12 horas.',
  40,
  'consumable',
  'RELIEF_LUCK_BOOST',
  'Shield',
  1,
  null,
  '{"activation": "active", "luckBonus": 0.04, "duration_hours": 12}'::jsonb,
  true,
  null
where not exists (
  select 1 from shop_items where name = 'Crachá de Prioridade'
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
  'VPN do Home Office',
  'Aumenta bastante sua chance de escapar de sorteios de risco por 48 horas.',
  130,
  'rare',
  'RELIEF_LUCK_BOOST',
  'Shield',
  2,
  null,
  '{"activation": "active", "luckBonus": 0.12, "duration_hours": 48}'::jsonb,
  true,
  null
where not exists (
  select 1 from shop_items where name = 'VPN do Home Office'
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
  '{"activation": "active", "multiplier": 1.2}'::jsonb,
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
  'Imã de Moedas Turbo',
  'Dispara seus ganhos de SetorCoins por 90 minutos.',
  220,
  'rare',
  'COIN_MAGNET',
  'Coins',
  3,
  90,
  '{"activation": "active", "multiplier": 1.8}'::jsonb,
  false,
  null
where not exists (
  select 1 from shop_items where name = 'Imã de Moedas Turbo'
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
  '{"activation": "active"}'::jsonb,
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
  '{"activation": "active", "xpBonus": 10, "coinBonus": 6}'::jsonb,
  true,
  null
where not exists (
  select 1 from shop_items where name = 'Vale Hora Extra'
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
  'Plantão Heroico',
  'No proximo sorteio Solo, voce recebe um bonus absurdo de XP e moedas.',
  210,
  'rare',
  'SOLO_REWARD_BOOST',
  'BriefcaseBusiness',
  3,
  null,
  '{"activation": "active", "xpBonus": 18, "coinBonus": 12}'::jsonb,
  true,
  null
where not exists (
  select 1 from shop_items where name = 'Plantão Heroico'
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
  'Atestado de Agua',
  'Prepara imunidade para a proxima Agua e joga o turno para outro participante aleatorio.',
  85,
  'consumable',
  'SKIP_AGUA_NEXT',
  'Shield',
  1,
  null,
  '{"activation": "active"}'::jsonb,
  true,
  'agua'
where not exists (
  select 1 from shop_items where name = 'Atestado de Agua'
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
  'Boia Corporativa',
  'Reduz o impacto da proxima Agua para voce.',
  70,
  'consumable',
  'AGUA_SHIELD',
  'Shield',
  1,
  null,
  '{"activation": "active", "damageReduction": 6}'::jsonb,
  true,
  'agua'
where not exists (
  select 1 from shop_items where name = 'Boia Corporativa'
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
  'Boia de Emergencia',
  'Fica no inventario e terceiriza automaticamente a proxima Agua em que voce for sorteado.',
  165,
  'rare',
  'AUTO_OUTSOURCE_AGUA',
  'RefreshCw',
  2,
  null,
  '{"activation": "auto"}'::jsonb,
  true,
  'agua'
where not exists (
  select 1 from shop_items where name = 'Boia de Emergencia'
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
  'Seguro Catastrofe',
  'Fica no inventario e transfere automaticamente o proximo Pao para outro participante elegivel.',
  230,
  'rare',
  'AUTO_TRANSFER_PAO',
  'ScrollText',
  3,
  null,
  '{"activation": "auto"}'::jsonb,
  true,
  'pao'
where not exists (
  select 1 from shop_items where name = 'Seguro Catastrofe'
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
  'Colete Anti-Balde',
  'Fica no inventario e reduz automaticamente o dano do proximo Balde.',
  110,
  'consumable',
  'AUTO_BALDE_SHIELD',
  'Shield',
  1,
  null,
  '{"activation": "auto", "damageReduction": 12}'::jsonb,
  true,
  'balde'
where not exists (
  select 1 from shop_items where name = 'Colete Anti-Balde'
);

commit;
