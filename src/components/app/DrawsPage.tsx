import type { ReactNode } from "react";

import { Coffee, Droplets, PaintBucket, Star } from "lucide-react";

import { DrawCategoryCard } from "./DrawCategoryCard";

type DrawCategory = "pao" | "agua" | "balde" | "geral";

type DrawsPageProps = {
  profilesCount: number;
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
  onBack: () => void;
  onSetAguaMode: (mode: "muita" | "pouca") => void;
  onDraw: (category: DrawCategory) => void;
  getParticipationCount: (category: DrawCategory) => number;
  getParticipationRatio: (category: DrawCategory) => number;
};

function EmptyState({ icon }: { icon: ReactNode }) {
  return (
    <div className="retro-empty-state w-full max-w-[240px]">
      <div className="retro-empty-icon">{icon}</div>
      <p className="pixel-text text-[8px] text-white/45">
        AGUARDANDO
        <br />
        SORTEIO
      </p>
    </div>
  );
}

export function DrawsPage({
  profilesCount,
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
  onBack,
  onSetAguaMode,
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
            <p className="pixel-text mt-2 text-[7px] text-white/55">
              EXECUTE O TURNO COM O GRUPO JÁ PREPARADO NA CENTRAL DE
              PARTICIPANTES
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="pixel-text border-2 border-white bg-black px-4 py-2 text-[7px] text-white hover:border-[var(--color-snes-gold)] hover:text-[var(--color-snes-gold)]"
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
                className={`text-[8px] px-2 py-1 font-black uppercase tracking-wider transition-none border-2 ${
                  aguaMode === "pouca"
                    ? "bg-blue-600 text-white border-white shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    : "bg-black text-zinc-500 border-zinc-800 hover:text-white hover:border-white"
                }`}
              >
                Pouca (1)
              </button>
              <button
                onClick={() => onSetAguaMode("muita")}
                className={`text-[8px] px-2 py-1 font-black uppercase tracking-wider transition-none border-2 ${
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

      {mageSection}
    </>
  );
}
