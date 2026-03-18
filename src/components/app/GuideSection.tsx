import { AlertCircle, Crosshair, Heart, Shield, Wand2 } from "lucide-react";

export function GuideSection() {
  return (
    <section className="glass-card flex min-h-[420px] flex-col p-5 lg:min-h-[calc(100vh-170px)] lg:p-6">
      <div className="mb-6 flex items-center justify-between border-b-2 border-white/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="border-2 border-white bg-black/35 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-5 w-5 text-[var(--color-snes-gold)]" />
          </div>
          <div>
            <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
              COMO JOGAR
            </h2>
            <p className="retro-copy-sm mt-2 text-white/75">
              GUIA RÁPIDO DO SISTEMA, CLASSES E LOJA
            </p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-2 xl:grid-cols-2">
        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            VISÃO GERAL
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/85">
              Cada participante acumula XP, nível, HP e SetorCoins conforme os
              sorteios acontecem.
            </p>
            <p className="retro-copy-sm text-white/85">
              O objetivo é evoluir a classe, sobreviver aos sorteios piores e
              usar a loja para melhorar o desempenho diário.
            </p>
            <p className="retro-copy-sm text-white/85">
              O HP também representa sanidade. Quando fica baixo demais, os
              ganhos de moedas caem.
            </p>
            <p className="retro-copy-sm text-white/85">
              De segunda a sexta, todo perfil recupera 10% do HP uma vez por dia
              no primeiro sorteio oficial processado.
            </p>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            PROGRESSÃO
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/85">
              Todo mundo começa como Novato.
            </p>
            <p className="retro-copy-sm text-white/85">
              No nível 3, o jogador escolhe uma trilha de aprendiz.
            </p>
            <p className="retro-copy-sm text-white/85">
              No nível 5, a classe final é liberada.
            </p>
            <p className="retro-copy-sm text-white/85">
              Novato recebe +10% XP enquanto aprende o sistema.
            </p>
            <p className="retro-copy-sm text-white/85">
              Toda subida de nível restaura o HP e concede +20 SetorCoins.
            </p>
            <p className="retro-copy-sm text-white/85">
              Toda subida de nível também concede +3 pontos de atributo.
            </p>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            ATRIBUTOS
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/85">
              Os pontos de atributo são distribuídos no mesmo modal da
              progressão de classe.
            </p>
            <p className="retro-copy-sm text-white/85">
              Cada nível ganho entrega +3 pontos livres para especializar o
              perfil.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="border-2 border-white/20 bg-black/30 p-3">
                <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                  FOCO
                </div>
                <p className="retro-copy-sm mt-2 text-white/85">
                  +0.5 XP base por resultado.
                </p>
              </div>
              <div className="border-2 border-white/20 bg-black/30 p-3">
                <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                  RESILIÊNCIA
                </div>
                <p className="retro-copy-sm mt-2 text-white/85">
                  +1 HP máximo e +1 HP imediato por ponto.
                </p>
              </div>
              <div className="border-2 border-white/20 bg-black/30 p-3">
                <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                  NETWORKING
                </div>
                <p className="retro-copy-sm mt-2 text-white/85">
                  +0.5% no ganho passivo de moedas por ponto.
                </p>
              </div>
              <div className="border-2 border-white/20 bg-black/30 p-3">
                <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                  MALANDRAGEM
                </div>
                <p className="retro-copy-sm mt-2 text-white/85">
                  +0.5% de chance de esquiva por ponto.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            CLASSES
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-2 border-red-400/40 bg-red-950/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-300" />
                <span className="retro-copy-sm text-white">Guerreiro</span>
              </div>
              <p className="retro-copy-sm text-white/85">
                Reduz dano ruim e ganha XP passivo em todo sorteio.
              </p>
            </div>
            <div className="border-2 border-blue-400/40 bg-blue-950/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-blue-300" />
                <span className="retro-copy-sm text-white">Mago</span>
              </div>
              <p className="retro-copy-sm text-white/85">
                Recebe desconto na loja e acessa o Olhar Arcano.
              </p>
            </div>
            <div className="border-2 border-emerald-400/40 bg-emerald-950/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-emerald-300" />
                <span className="retro-copy-sm text-white">Ladino</span>
              </div>
              <p className="retro-copy-sm text-white/85">
                Pode esquivar e ganha mais moedas quando escapa do sorteio.
              </p>
            </div>
            <div className="border-2 border-pink-400/40 bg-pink-950/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-300" />
                <span className="retro-copy-sm text-white">Clérigo</span>
              </div>
              <p className="retro-copy-sm text-white/85">
                Distribui moedas extras ao grupo e recupera melhor após Pão.
              </p>
            </div>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            OLHAR ARCANO
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/85">
              É o painel especial do Mago. Ele mostra leituras extras do
              sistema.
            </p>
            <p className="retro-copy-sm text-white/85">
              Hoje o Mago enxerga as filas por categoria e um log mais detalhado
              das ações recentes.
            </p>
            <p className="retro-copy-sm text-white/85">
              O painel aparece quando existe um perfil Mago ou Aprendiz Mago
              selecionado como foco arcano.
            </p>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            CATEGORIAS
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-2 border-blue-400/40 bg-black/30 p-3">
              <div className="pixel-text-soft text-[7px] text-blue-300">
                ÁGUA
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Sorteado: +10 XP e +5 $C. Participantes não selecionados: +5 XP
                e -8 HP.
              </p>
              <p className="retro-copy-sm mt-2 text-blue-200/90">
                O dano agora vai para quem participou e nao foi selecionado.
              </p>
            </div>
            <div className="border-2 border-purple-400/40 bg-black/30 p-3">
              <div className="pixel-text-soft text-[7px] text-purple-300">
                BALDE
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Sorteado: +30 XP e +15 $C. Participantes nao selecionados: +10
                XP e -18 HP.
              </p>
              <p className="retro-copy-sm mt-2 text-purple-200/90">
                O sorteado leva a recompensa; o resto absorve o desgaste.
              </p>
            </div>
            <div className="border-2 border-orange-400/40 bg-black/30 p-3">
              <div className="pixel-text-soft text-[7px] text-orange-300">
                PÃO DE QUEIJO
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Participantes nao selecionados: +20 XP, +10 $C, -25 HP e sorte
                temporaria. O sorteado escapa do dano.
              </p>
              <p className="retro-copy-sm mt-2 text-orange-200/90">
                Continua sendo o evento mais pesado do setor.
              </p>
            </div>
            <div className="border-2 border-emerald-400/40 bg-black/30 p-3">
              <div className="pixel-text-soft text-[7px] text-emerald-300">
                GERAL
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Todos ganham +5 $C. Participantes nao selecionados ainda perdem
                -5 HP.
              </p>
              <p className="retro-copy-sm mt-2 text-emerald-200/90">
                O selecionado so recebe a recompensa base.
              </p>
            </div>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            EXAUSTÃO E FEITOS
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/85">
              Quando o HP fica abaixo do limite de exaustão, o jogador recebe
              menos moedas.
            </p>
            <p className="retro-copy-sm text-white/85">
              Os feitos aparecem conforme eventos reais do jogo, como vencer Pão
              ou Balde.
            </p>
            <p className="retro-copy-sm text-white/85">
              O título pessoal é separado dos feitos e pode ser definido pelo
              próprio jogador.
            </p>
            <p className="retro-copy-sm text-white/85">
              Gastos de SetorCoins acontecem na loja; fora dela, as perdas de
              moedas ficam restritas a compras e futuros ajustes do meta.
            </p>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            ECONOMIA
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/85">
              Ganhos atuais por nivel: +20 $C por level up.
            </p>
            <p className="retro-copy-sm text-white/85">
              Ganhos base por sorteio: PAO +10 $C para nao sorteados, AGUA +5 $C
              para sorteado, BALDE +15 $C para sorteado, GERAL +5 $C para todos
              e SOLO +8 $C para o selecionado.
            </p>
            <p className="retro-copy-sm text-white/85">
              Moedas extras ainda podem ser alteradas por Ladino, Clerigo, Ima
              de Moedas, descontos de Mago e penalidade por exaustao.
            </p>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            LOJA E ITENS
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                CAFE EXPRESSO · 35 $C
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Recupera 50% do HP instantaneamente.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                RELATÓRIO FALSO
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Tira o jogador do próximo Balde.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                BAND-AID CORPORATIVO · 55 $C
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Recupera 100 HP instantaneamente.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                CAPA DE FUGA · 60 $C
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Aumenta a sorte de fuga por 24 horas.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                IMA DE MOEDAS LITE · 95 $C
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Bonus menor de moedas por 30 minutos.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                IMÃ DE MOEDAS
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Aumenta ganhos por tempo limitado.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                PROCURACAO DO PAO · 140 $C
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Transfere o próximo Pão para outra pessoa.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                TERCEIRIZACAO · 180 $C
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Terceiriza a próxima Água se o jogador for sorteado.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text-soft text-[7px] text-[var(--color-snes-gold)]">
                VALE HORA EXTRA · 160 $C
              </div>
              <p className="retro-copy-sm mt-2 text-white/85">
                Reforça o próximo sorteio Solo com XP e moedas extras.
              </p>
            </div>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            SORTEIO SOLO
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/85">
              Serve para dias em que alguem vai sozinho e nao existe fila real
              para disputar.
            </p>
            <p className="retro-copy-sm text-white/85">
              O participante selecionado ganha +12 XP e +8 $C, sem causar dano
              colateral no resto do grupo.
            </p>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            ROADMAP
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/85">
              Sugestoes atuais dos participantes: mais eventos cooperativos,
              passivas globais mais visiveis e economia com metas semanais.
            </p>
            <p className="retro-copy-sm text-white/85">
              Proximos candidatos: missoes de equipe, recompensas por frequencia
              e novos consumiveis utilitarios.
            </p>
          </div>
        </section>

        <section className="retro-panel xl:col-span-2">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            FLUXO RECOMENDADO
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/85">
              1. Adicione os participantes e ajuste quem entra em cada
              categoria.
            </p>
            <p className="retro-copy-sm text-white/85">
              2. Deixe todos evoluírem como Novato até destravar a trilha.
            </p>
            <p className="retro-copy-sm text-white/85">
              3. Abra a página Sorteios para executar o turno do setor.
            </p>
            <p className="retro-copy-sm text-white/85">
              4. Use a loja para recuperar HP ou alterar o meta.
            </p>
            <p className="retro-copy-sm text-white/85">
              5. O fluxo padrão usa participação contínua. O grupo não é
              eliminado por ciclo.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
