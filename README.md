# DevGacha

Aplicacao web de sorteios gamificados para o setor, com progressao RPG, loja, logs e roadmap colaborativo.

## Rodando localmente

Requisitos:
- Node.js 20+
- npm

Instalacao e execucao:

```bash
npm install
npm run dev
```

Servidor local: `http://localhost:3000`

## Variaveis de ambiente

Crie um `.env` a partir de `.env.example`.

Obrigatorias para modo Supabase:
- `SUPABASE_URL`
- `SUPABASE_KEY`

Opcional:
- `APP_ACCESS_PASSWORD` (se definido, a API exige desbloqueio de acesso)

## Arquitetura (resumo)

- `api/index.ts`: servidor Express, rotas HTTP e integracao com Supabase.
- `shared/drawLogic.ts`: logica compartilhada de processamento de sorteio.
- `api/drawLogic.ts`: reexport para manter compatibilidade de import no backend.
- `src/services/api.ts`: cliente HTTP do frontend.
- `src/services/localApi.ts`: fallback local para cenarios sem backend funcional.

## Roadmap colaborativo

Quadro Kanban com fases:
- `pending` (Em pauta)
- `in_progress` (Em andamento)
- `done` (Concluido)
- `discarded` (Descartados)

Funcionalidades:
- Voto por card
- Drag-and-drop entre colunas para atualizar a fase
- Descricoes mais longas para detalhar proposta

## Migracoes Supabase

Aplicar em ordem:
1. `supabase_phase1_schema_upgrade.sql`
2. `supabase_phase2_roadmap_and_stats.sql`
3. `supabase_phase3_reconcile.sql`
4. `supabase_phase4_daily_challenges.sql`
5. `supabase_shop_items_refresh.sql`
6. `supabase_phase5_roadmap_discarded.sql`

> A fase 5 atualiza o constraint de status do roadmap para aceitar `discarded`.

## Verificacao rapida em producao (Vercel)

Use os endpoints:
- `/api/health`
- `/api/access/status`
- `/api/profiles`

Se `/api/health` falhar com 500, confira primeiro as variaveis de ambiente do projeto na Vercel.

## Testes

```bash
npm test
```
