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
            <p className="pixel-text mt-2 text-[7px] text-white/55">
              GUIA RÁPIDO DO SISTEMA, CLASSES E LOJA
            </p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-2 xl:grid-cols-2">
        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            VISÃO GERAL
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Cada participante acumula XP, nível, HP e SetorCoins conforme os
              sorteios acontecem.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              O objetivo é evoluir a classe, sobreviver aos sorteios piores e
              usar a loja para melhorar o desempenho diário.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              O HP também representa sanidade. Quando fica baixo demais, os
              ganhos de moedas caem.
            </p>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            PROGRESSÃO
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Todo mundo começa como Novato.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              No nível 3, o jogador escolhe uma trilha de aprendiz.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              No nível 5, a classe final é liberada.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Novato recebe +10% XP enquanto aprende o sistema.
            </p>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            CLASSES
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-2 border-red-400/40 bg-red-950/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-300" />
                <span className="pixel-text text-[7px] text-white">
                  Guerreiro
                </span>
              </div>
              <p className="pixel-text text-[7px] text-white/65">
                Reduz dano ruim e ganha XP passivo em todo sorteio.
              </p>
            </div>
            <div className="border-2 border-blue-400/40 bg-blue-950/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-blue-300" />
                <span className="pixel-text text-[7px] text-white">Mago</span>
              </div>
              <p className="pixel-text text-[7px] text-white/65">
                Recebe desconto na loja e acessa o Olhar Arcano.
              </p>
            </div>
            <div className="border-2 border-emerald-400/40 bg-emerald-950/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-emerald-300" />
                <span className="pixel-text text-[7px] text-white">Ladino</span>
              </div>
              <p className="pixel-text text-[7px] text-white/65">
                Pode esquivar e ganha mais moedas quando escapa do sorteio.
              </p>
            </div>
            <div className="border-2 border-pink-400/40 bg-pink-950/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-300" />
                <span className="pixel-text text-[7px] text-white">
                  Clérigo
                </span>
              </div>
              <p className="pixel-text text-[7px] text-white/65">
                Distribui moedas extras ao grupo e recupera melhor após Pão.
              </p>
            </div>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            CATEGORIAS
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-2 border-blue-400/40 bg-black/30 p-3">
              <div className="pixel-text text-[7px] text-blue-300">ÁGUA</div>
              <p className="pixel-text mt-2 text-[7px] text-white/65">
                Tarefa diária, segura, com ganho leve de XP e moedas.
              </p>
            </div>
            <div className="border-2 border-purple-400/40 bg-black/30 p-3">
              <div className="pixel-text text-[7px] text-purple-300">BALDE</div>
              <p className="pixel-text mt-2 text-[7px] text-white/65">
                Desafio intermediário, dá mais XP e cobra HP.
              </p>
            </div>
            <div className="border-2 border-orange-400/40 bg-black/30 p-3">
              <div className="pixel-text text-[7px] text-orange-300">
                PÃO DE QUEIJO
              </div>
              <p className="pixel-text mt-2 text-[7px] text-white/65">
                Evento pesado; quem escapa recebe alívio e sorte temporária.
              </p>
            </div>
            <div className="border-2 border-emerald-400/40 bg-black/30 p-3">
              <div className="pixel-text text-[7px] text-emerald-300">
                GERAL
              </div>
              <p className="pixel-text mt-2 text-[7px] text-white/65">
                Evento neutro com moedas base para todos os envolvidos.
              </p>
            </div>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            EXAUSTÃO E FEITOS
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Quando o HP fica abaixo do limite de exaustão, o jogador recebe
              menos moedas.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Os feitos aparecem conforme eventos reais do jogo, como vencer Pão
              ou Balde.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              O título pessoal é separado dos feitos e pode ser definido pelo
              próprio jogador.
            </p>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            LOJA E ITENS
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text text-[7px] text-[var(--color-snes-gold)]">
                CAFÉ EXPRESSO
              </div>
              <p className="pixel-text mt-2 text-[7px] text-white/65">
                Recupera 50% do HP instantaneamente.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text text-[7px] text-[var(--color-snes-gold)]">
                RELATÓRIO FALSO
              </div>
              <p className="pixel-text mt-2 text-[7px] text-white/65">
                Tira o jogador do próximo Balde.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text text-[7px] text-[var(--color-snes-gold)]">
                IMÃ DE MOEDAS
              </div>
              <p className="pixel-text mt-2 text-[7px] text-white/65">
                Aumenta ganhos por tempo limitado.
              </p>
            </div>
            <div className="border-2 border-white/20 bg-black/35 p-3">
              <div className="pixel-text text-[7px] text-[var(--color-snes-gold)]">
                TERCEIRIZAÇÃO
              </div>
              <p className="pixel-text mt-2 text-[7px] text-white/65">
                Terceiriza a próxima Água se o jogador for sorteado.
              </p>
            </div>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4 xl:col-span-2">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            FLUXO RECOMENDADO
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              1. Adicione os participantes e ajuste quem entra em cada
              categoria.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              2. Deixe todos evoluírem como Novato até destravar a trilha.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              3. Abra a página Sorteios para executar o turno do setor.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              4. Use a loja para recuperar HP ou alterar o meta.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              5. O fluxo padrão usa participação contínua. O grupo não é
              eliminado por ciclo.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
