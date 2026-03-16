import type { ReactNode } from "react";

import { Coffee, Droplets, PaintBucket, Star } from "lucide-react";

import { DrawCategoryCard } from "./DrawCategoryCard";
import type { DrawMode } from "../../app/constants";
import type { DrawRewardSummary } from "../../types";

type DrawCategory = "pao" | "agua" | "balde" | "geral";

type DrawsPageProps = {
  profilesCount: number;
  drawMode: DrawMode;
  aguaMode: "muita" | "pouca";
  mageSection: ReactNode;
  paoDeQueijoWinners: string[];
  aguaWinners: string[];
  baldeWinners: string[];
  geralWinners: string[];
  isDrawingPao: boolean;
  isDrawingAgua: boolean;
  isDrawingBalde: boolean;
  isDrawingGeral: boolean;
  cyclingNamePao: string;
  cyclingNameAgua: string;
  cyclingNameBalde: string;
  cyclingNameGeral: string;
  lastDrawRewards: DrawRewardSummary[];
  onBack: () => void;
  onSetAguaMode: (mode: "muita" | "pouca") => void;
  onSetDrawMode: (mode: DrawMode) => void;
  onDraw: (category: DrawCategory) => void;
  getParticipationCount: (category: DrawCategory) => number;
  getParticipationRatio: (category: DrawCategory) => number;
};

function EmptyState({ icon }: { icon: ReactNode }) {
  return (
    <div className="retro-empty-state w-full max-w-[240px]">
      <div className="retro-empty-icon">{icon}</div>
      <p className="retro-copy text-white/60">
        AGUARDANDO
        <br />
        SORTEIO
      </p>
    </div>
  );
}

export function DrawsPage({
  profilesCount,
  drawMode,
  aguaMode,
  mageSection,
  paoDeQueijoWinners,
  aguaWinners,
  baldeWinners,
  geralWinners,
  isDrawingPao,
  isDrawingAgua,
  isDrawingBalde,
  isDrawingGeral,
  cyclingNamePao,
  cyclingNameAgua,
  cyclingNameBalde,
  cyclingNameGeral,
  lastDrawRewards,
  onBack,
  onSetAguaMode,
  onSetDrawMode,
  onDraw,
  getParticipationCount,
  getParticipationRatio,
}: DrawsPageProps) {
  return (
    <>
      <section className="glass-card p-5">
        <div className="flex flex-col gap-4 border-b-2 border-white/20 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
              MESA DE SORTEIOS
            </h2>
            <p className="retro-copy-sm mt-2 text-white/75">
              EXECUTE O TURNO COM O GRUPO JÁ PREPARADO NA CENTRAL DE
              PARTICIPANTES
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSetDrawMode("training")}
                className={`retro-label border-2 px-3 py-1.5 ${
                  drawMode === "training"
                    ? "border-white bg-yellow-500 text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    : "border-white/40 bg-black text-white/70 hover:border-white hover:text-white"
                }`}
              >
                Modo Treino
              </button>
              <button
                type="button"
                onClick={() => onSetDrawMode("official")}
                className={`retro-label border-2 px-3 py-1.5 ${
                  drawMode === "official"
                    ? "border-white bg-emerald-500 text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    : "border-white/40 bg-black text-white/70 hover:border-white hover:text-white"
                }`}
              >
                Modo Oficial
              </button>
              <span
                className={`retro-label border px-2 py-1 ${
                  drawMode === "training"
                    ? "border-yellow-300 bg-yellow-950/40 text-yellow-200"
                    : "border-emerald-300 bg-emerald-950/40 text-emerald-200"
                }`}
              >
                {drawMode === "training"
                  ? "TREINO: sem progresso real"
                  : "OFICIAL: grava progresso"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="snes-ui-text border-2 border-white bg-black px-4 py-2 text-white hover:border-[var(--color-snes-gold)] hover:text-[var(--color-snes-gold)]"
          >
            VOLTAR PARA PARTICIPANTES
          </button>
        </div>
      </section>

      <div className="grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2">
        <DrawCategoryCard
          title="Pão de Queijo"
          meta="WORLD BOSS DO SETOR"
          progressColorClass="bg-orange-500"
          winnerColorClass="text-orange-500"
          emptyState={
            <EmptyState icon={<Coffee className="h-7 w-7 text-white/20" />} />
          }
          participationCount={getParticipationCount("pao")}
          totalProfiles={profilesCount}
          progressWidth={getParticipationRatio("pao")}
          isDrawing={isDrawingPao}
          cyclingName={cyclingNamePao}
          winners={paoDeQueijoWinners}
          winnerHeading="O escolhido é"
          onDraw={() => onDraw("pao")}
          disabled={isDrawingPao || getParticipationCount("pao") === 0}
        />

        <DrawCategoryCard
          title="Água"
          meta="QUEST DIARIA DO SETOR"
          progressColorClass="bg-blue-500"
          winnerColorClass="text-blue-500"
          emptyState={
            <EmptyState icon={<Droplets className="h-7 w-7 text-white/20" />} />
          }
          participationCount={getParticipationCount("agua")}
          totalProfiles={profilesCount}
          progressWidth={getParticipationRatio("agua")}
          isDrawing={isDrawingAgua}
          cyclingName={cyclingNameAgua}
          winners={aguaWinners}
          winnerHeading={
            aguaWinners.length > 1 ? "Os escolhidos são" : "O escolhido é"
          }
          onDraw={() => onDraw("agua")}
          disabled={isDrawingAgua || getParticipationCount("agua") === 0}
          headerExtras={
            <div className="flex gap-1.5">
              <button
                onClick={() => onSetAguaMode("pouca")}
                className={`retro-label px-2 py-1 transition-none border-2 ${
                  aguaMode === "pouca"
                    ? "bg-blue-600 text-white border-white shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    : "bg-black text-zinc-500 border-zinc-800 hover:text-white hover:border-white"
                }`}
              >
                Pouca (1)
              </button>
              <button
                onClick={() => onSetAguaMode("muita")}
                className={`retro-label px-2 py-1 transition-none border-2 ${
                  aguaMode === "muita"
                    ? "bg-blue-600 text-white border-white shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    : "bg-black text-zinc-500 border-zinc-800 hover:text-white hover:border-white"
                }`}
              >
                Muita (2)
              </button>
            </div>
          }
        />

        <DrawCategoryCard
          title="Balde"
          meta="DESAFIO INTERMEDIARIO"
          progressColorClass="bg-purple-500"
          winnerColorClass="text-purple-500"
          emptyState={
            <EmptyState
              icon={<PaintBucket className="h-7 w-7 text-white/20" />}
            />
          }
          participationCount={getParticipationCount("balde")}
          totalProfiles={profilesCount}
          progressWidth={getParticipationRatio("balde")}
          isDrawing={isDrawingBalde}
          cyclingName={cyclingNameBalde}
          winners={baldeWinners}
          winnerHeading="O escolhido é"
          onDraw={() => onDraw("balde")}
          disabled={isDrawingBalde || getParticipationCount("balde") === 0}
        />

        <DrawCategoryCard
          title="Geral"
          meta="RECOMPENSA BASE DO SETOR"
          progressColorClass="bg-emerald-500"
          winnerColorClass="text-emerald-500"
          emptyState={
            <EmptyState icon={<Star className="h-7 w-7 text-white/20" />} />
          }
          participationCount={getParticipationCount("geral")}
          totalProfiles={profilesCount}
          progressWidth={getParticipationRatio("geral")}
          isDrawing={isDrawingGeral}
          cyclingName={cyclingNameGeral}
          winners={geralWinners}
          winnerHeading="O escolhido é"
          onDraw={() => onDraw("geral")}
          disabled={isDrawingGeral || getParticipationCount("geral") === 0}
        />
      </div>

      {drawMode === "official" && lastDrawRewards.length > 0 ? (
        <section className="glass-card p-5">
          <div className="flex flex-col gap-3 border-b-2 border-white/20 pb-3">
            <h3 className="pixel-text text-[9px] text-[var(--color-snes-gold)]">
              RESUMO DO ULTIMO SORTEIO
            </h3>
            <p className="retro-copy-sm text-white/70">
              GANHOS DE XP E SETORCOINS POR PARTICIPANTE
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {lastDrawRewards
              .slice()
              .sort(
                (left, right) => Number(right.isWinner) - Number(left.isWinner),
              )
              .map((reward) => (
                <article
                  key={reward.profileId}
                  className={`border-2 px-3 py-3 ${
                    reward.isWinner
                      ? "border-[var(--color-snes-gold)] bg-yellow-950/20"
                      : "border-white/30 bg-black/35"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="pixel-text text-[8px] text-white">
                      {reward.profileName}
                    </span>
                    {reward.isWinner ? (
                      <span className="retro-label border border-[var(--color-snes-gold)] bg-black px-2 py-0.5 text-[var(--color-snes-gold)]">
                        SORTEADO
                      </span>
                    ) : null}
                  </div>

                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <div className="border border-white/30 bg-black/30 px-2 py-1">
                      <div className="retro-copy-sm text-white/60">XP</div>
                      <div className="pixel-text text-[8px] text-emerald-300">
                        {reward.xpGain > 0
                          ? `+${reward.xpGain}`
                          : reward.xpGain}
                      </div>
                    </div>
                    <div className="border border-white/30 bg-black/30 px-2 py-1">
                      <div className="retro-copy-sm text-white/60">$C</div>
                      <div className="pixel-text text-[8px] text-cyan-300">
                        {reward.coinGain > 0
                          ? `+${reward.coinGain}`
                          : reward.coinGain}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {reward.xpBreakdown.map((item, index) => (
                      <div
                        key={`xp-${reward.profileId}-${index}`}
                        className="flex items-center justify-between border-l-2 border-emerald-400/80 bg-emerald-950/20 px-2 py-1"
                      >
                        <span className="retro-copy-sm text-white/75">
                          {item.label}
                        </span>
                        <span className="retro-copy-sm text-emerald-300">
                          {item.value > 0
                            ? `+${item.value} XP`
                            : `${item.value} XP`}
                        </span>
                      </div>
                    ))}
                    {reward.coinBreakdown.map((item, index) => (
                      <div
                        key={`coins-${reward.profileId}-${index}`}
                        className="flex items-center justify-between border-l-2 border-cyan-400/80 bg-cyan-950/20 px-2 py-1"
                      >
                        <span className="retro-copy-sm text-white/75">
                          {item.label}
                        </span>
                        <span className="retro-copy-sm text-cyan-300">
                          {item.value > 0
                            ? `+${item.value} $C`
                            : `${item.value} $C`}
                        </span>
                      </div>
                    ))}
                    {reward.xpBreakdown.length === 0 &&
                    reward.coinBreakdown.length === 0 ? (
                      <div className="retro-copy-sm border border-white/20 bg-black/30 px-2 py-1 text-white/60">
                        Sem ganho de XP ou moedas neste sorteio.
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
          </div>
        </section>
      ) : null}

      {mageSection}
    </>
  );
}
