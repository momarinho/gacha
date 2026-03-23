begin;

insert into roadmap (title, description, status, created_by, votes)
select
  'Fura Olho',
  'Novo item na loja. Se voce participar de uma roleta e nao for sorteado, voce ganha a recompensa de quem foi sorteado e ele nao ganha nada.',
  'in_progress',
  (
    select id
    from profiles
    where lower(name) = lower('VT')
    limit 1
  ),
  67
where not exists (
  select 1
  from roadmap
  where lower(title) = lower('Fura Olho')
);

insert into roadmap (title, description, status, created_by, votes)
select
  'Briga',
  'Colocar um premio que permite roubar algo do inventario de outra pessoa.',
  'in_progress',
  (
    select id
    from profiles
    where lower(name) = lower('DIOGO')
    limit 1
  ),
  0
where not exists (
  select 1
  from roadmap
  where lower(title) = lower('Briga')
);

insert into roadmap (title, description, status, created_by, votes)
select
  'Bolo do VT',
  'VT tem que trazer bolo toda sexta.',
  'in_progress',
  (
    select id
    from profiles
    where lower(name) = lower('FIE')
    limit 1
  ),
  0
where not exists (
  select 1
  from roadmap
  where lower(title) = lower('Bolo do VT')
);

insert into roadmap (title, description, status, created_by, votes)
select
  'Roleta de Filho',
  'Vou roletar quem vai ser o proximo do grupo que vai ter que engravidar alguem.',
  'in_progress',
  (
    select id
    from profiles
    where lower(name) = lower('FIE')
    limit 1
  ),
  0
where not exists (
  select 1
  from roadmap
  where lower(title) = lower('Roleta de Filho')
);

commit;
