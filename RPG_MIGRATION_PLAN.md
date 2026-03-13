# 📝 Plano de Migração RPG: Setor Quest

Este plano foi reorganizado por ordem de execução real, e não mais por camadas técnicas. A ideia é manter primeiro o que já está concluído, depois o que deve ser feito agora, e por fim o acabamento.

## 1. Fundação Já Concluída

### Banco e estrutura base
- [x] Criar tabelas principais no Supabase (`profiles`, `shop_items`, `battle_logs`).
- [x] Inserir catálogo inicial da loja.
- [x] Desativar RLS temporariamente nas tabelas novas.
- [x] Expandir o schema de `profiles` para suportar:
  - [x] sorte
  - [x] títulos
  - [x] efeitos temporários
  - [x] modificadores de moedas
  - [x] parâmetros de exaustão
- [x] Expandir o schema de `shop_items` para o meta atual.
- [x] Adicionar defaults, checks e índices compatíveis com as regras do jogo.

### Backend principal
- [x] CRUD de `profiles`.
- [x] Catálogo da loja via API.
- [x] Histórico global via API.
- [x] Compra de itens com transação segura.
- [x] Uso de itens pelo inventário.
- [x] Processamento de sorteio no backend.
- [x] Estado global de sorteio persistido em `raffle_state`.
- [x] Visão privilegiada do Mago via API:
  - [x] histórico detalhado
  - [x] fila de exclusão por categoria

### Frontend principal
- [x] Tipagens base de `Profile`, `ShopItem`, `BattleLog`.
- [x] Estado migrado para `profiles`.
- [x] Serviços para consumir a API.
- [x] Tipagens alinhadas com:
  - [x] sorte
  - [x] títulos
  - [x] exaustão
  - [x] buffs adicionais
  - [x] modificadores de economia
- [x] Estado do frontend consumindo ranking, títulos e visão do Mago.

### UI já pronta
- [x] Modal de escolha de classe.
- [x] Cards de participantes com HP, XP, nível, classe e moedas.
- [x] Loja do setor.
- [x] Histórico de batalha.
- [x] Hall da Fama.
- [x] Títulos visíveis.
- [x] Painel restrito de visão do Mago.
- [x] Visual principal em direção SNES / retro corporativa.
- [x] Branding atualizado para `DevGacha`.

### Motor já pronto
- [x] `drawWinner` integrado ao backend.
- [x] XP, nível, moedas e dano de sanidade por sorteio.
- [x] Regra de exaustão aplicada no cálculo.
- [x] Títulos básicos disparados pelos resultados.
- [x] Dinâmica base das categorias:
  - [x] Água
  - [x] Balde
  - [x] Pão de Queijo
  - [x] Geral
- [x] Passivas já implementadas em funcionamento:
  - [x] Ladino: esquiva + bônus ao não ser sorteado
  - [x] Guerreiro: redução de dano + XP passivo
  - [x] Mago: desconto na loja + visão privilegiada
  - [x] Clérigo: bônus para o grupo + recuperação melhorada

### Itens e inventário
- [x] Inventário do jogador.
- [x] Consumo de itens.
- [x] Itens que afetam sorteio.
- [x] Catálogo alinhado ao meta atual:
  - [x] Café Expresso
  - [x] Relatório Falso
  - [x] Imã de Moedas
  - [x] Contrato de Terceirização
- [x] Remover/substituir itens antigos.
- [x] Efeitos da loja alinhados ao design atual.

## 2. Próxima Prioridade: Progressão de Classe

Esta passa a ser a prioridade principal antes de novos refinamentos visuais.

### 2.1 Reestruturar a progressão de classe
- [x] Transformar `novato` em estágio inicial oficial de progressão.
- [x] Introduzir a etapa intermediária `aprendiz de classe`.
- [x] Definir a trilha completa:
  - [x] `novato`
  - [x] `aprendiz_guerreiro`
  - [x] `aprendiz_mago`
  - [x] `aprendiz_ladino`
  - [x] `aprendiz_clerigo`
  - [x] `guerreiro`
  - [x] `mago`
  - [x] `ladino`
  - [x] `clerigo`

### 2.2 Regras de desbloqueio
- [x] Todo usuário novo começa obrigatoriamente como `novato`.
- [x] Definir e implementar o nível de promoção de `novato` para `aprendiz`.
- [x] Definir e implementar o nível de promoção de `aprendiz` para classe final.
- [x] Bloquear a seleção direta de classe final antes da progressão correta.

### 2.3 Passivas por estágio
- [x] Implementar a passiva de `novato`.
- [x] Implementar passivas parciais dos `aprendizes`.
- [x] Rebalancear as passivas finais para considerar a existência do estágio intermediário.

### 2.4 Persistência e modelo
- [x] Atualizar schema/tipagens para suportar os novos estados de classe.
- [ ] Ajustar constraints do banco para a nova árvore de classes.
- [x] Atualizar backend para processar `novato`, `aprendizes` e classes finais.

### 2.5 UI e UX da progressão
- [x] Atualizar a interface para mostrar o estágio atual de progressão.
- [x] Substituir o fluxo atual de escolha de classe por:
  - [x] promoção para `aprendiz`
  - [x] evolução para classe final
- [x] Exibir claramente quando uma promoção/evolução estiver disponível.
- [x] Atualizar textos e descrições de classe para refletir a nova progressão.

## 3. Próxima Onda: Clareza de Gameplay

Esta é a melhor ordem a seguir agora.

### 3.1 Feedback visual do estado do jogador
- [x] Exibir estado de exaustão / sanidade baixa com feedback visual.
- [x] Exibir poderes reais de classe na interface, alinhados com a lógica atual do backend.

### 3.2 Feedback visual de habilidades
- [x] Adicionar efeitos visuais por classe/habilidade:
  - [x] brilho arcano do Mago
  - [x] aura/bênção do Clérigo
  - [x] feedback de esquiva do Ladino
  - [x] feedback de resistência do Guerreiro

### 3.3 Refino do motor ainda em aberto
- [x] Revisar o motor do sorteio para garantir que todas as passivas globais estão refletidas de forma explícita e consistente.
- [x] Revisar as regras globais de economia para garantir:
  - [x] buffs temporários de sorte/alívio refletidos visualmente e tecnicamente
  - [x] modificadores passivos vindos de itens refletidos de ponta a ponta
  - [x] parâmetros persistidos do perfil sendo usados em todos os pontos corretos
- [x] Revisar os benefícios globais do Clérigo para fechar qualquer lacuna restante:
  - [x] aura de moedas para o grupo ao ser sorteado
  - [x] recuperação acelerada após eventos aplicáveis

## 4. Próxima Onda: Coerência e Polimento

Depois que a camada acima estiver estável.

### 4.1 Coerência de texto e regra
- [x] Revisar textos da UI para não prometer habilidades além do que já existe.
- [x] Garantir que frontend, backend, banco e seed da loja usem o mesmo vocabulário e as mesmas regras.

### 4.2 Backend social ainda opcional
- [x] Adicionar endpoints/processamento explícito para ranking e títulos no backend, em vez de depender só de derivação local no frontend.

### 4.3 Polimento visual final
- [x] Refinar os cards de sorteio para ficarem ainda mais próximos do mockup final.
- [x] Revisar animações e estados vazios para manter consistência visual com o tema retro.

## 5. Fechamento

Checklist final de validação ponta a ponta:
- [ ] Criar usuário
- [ ] Escolher classe
- [ ] Participar de sorteios
- [ ] Ganhar/perder HP, XP e moedas
- [ ] Comprar item
- [ ] Usar item
- [ ] Registrar log
- [ ] Refletir ranking
- [ ] Refletir títulos
- [ ] Refletir exaustão
- [ ] Refletir efeitos visuais de classe
