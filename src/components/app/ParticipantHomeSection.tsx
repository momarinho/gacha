import type { FormEvent } from "react";
import { User } from "lucide-react";

import { ParticipantRosterSection } from "./ParticipantRosterSection";
import { MageInsights, Profile } from "../../types";

type Category = "pao" | "agua" | "balde" | "geral";

type ParticipantHomeSectionProps = {
  profiles: Profile[];
  highestLevel: number;
  profilesLoadError: string | null;
  dailyChallenge: {
    title: string;
    description: string;
    completedCount: number;
  };
  newName: string;
  titleDrafts: Record<string, string>;
  titlesByProfileId: Record<string, string[]>;
  selectedMageId: string | null;
  mageInsights: MageInsights | null;
  onOpenDraws: () => void;
  onOpenGuide: () => void;
  onAddName: (event: FormEvent) => void;
  onNewNameChange: (value: string) => void;
  onOpenClassSelection: (profileId: string) => void;
  onOpenInventory: (profileId: string) => void;
  onToggleParticipation: (profileId: string, category: Category) => void;
  onTitleDraftChange: (profileId: string, title: string) => void;
  onSaveCustomTitle: (profile: Profile) => void;
  onRemoveProfile: (profileId: string) => void;
  getParticipationCount: (category: Category) => number;
  getExhaustionState: (profile: Profile) => {
    label: string;
    tone: "critical" | "warning" | "safe";
  };
  getCustomTitle: (profile: Profile) => string | null;
  getClassPowerText: (profileClass: Profile["class"]) => string;
  recentClassEffectsByProfileId: Record<
    string,
    {
      label: string;
      detail: string;
      cardClassName: string;
      badgeClassName: string;
    }
  >;
};

export function ParticipantHomeSection({
  profiles,
  highestLevel,
  profilesLoadError,
  dailyChallenge,
  newName,
  titleDrafts,
  titlesByProfileId,
  selectedMageId,
  mageInsights,
  onOpenDraws,
  onOpenGuide,
  onAddName,
  onNewNameChange,
  onOpenClassSelection,
  onOpenInventory,
  onToggleParticipation,
  onTitleDraftChange,
  onSaveCustomTitle,
  onRemoveProfile,
  getParticipationCount,
  getExhaustionState,
  getCustomTitle,
  getClassPowerText,
  recentClassEffectsByProfileId,
}: ParticipantHomeSectionProps) {
  return (
    <section className="glass-card flex min-h-[420px] flex-col p-5 lg:min-h-[calc(100vh-170px)] lg:p-6">
      <div className="mb-6 flex items-center justify-between border-b-2 border-white/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="border-2 border-white bg-black/35 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <User className="h-5 w-5 text-[var(--color-snes-gold)]" />
          </div>
          <div>
            <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
              CENTRAL DE PARTICIPANTES
            </h2>
            <p className="retro-copy-sm mt-2 text-white/75">
              MONTE O GRUPO ANTES DE ABRIR OS SORTEIOS
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenDraws}
          className="snes-ui-text border-2 border-white bg-[var(--color-snes-gold)] px-4 py-2 text-black hover:bg-white"
          disabled={profiles.length === 0}
        >
          ABRIR SORTEIOS
        </button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            RESUMO DO GRUPO
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="border-2 border-white/15 bg-black/35 p-3">
              <div className="retro-label text-white/70">TOTAL</div>
              <div className="pixel-text mt-2 text-[10px] text-white">
                {profiles.length}
              </div>
            </div>
            <div className="border-2 border-white/15 bg-black/35 p-3">
              <div className="retro-label text-white/70">NÍVEL MAIS ALTO</div>
              <div className="pixel-text mt-2 text-[10px] text-white">
                {highestLevel}
              </div>
            </div>
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            PARTICIPAÇÃO
          </h3>
          <div className="mt-4 space-y-3">
            {[
              ["Pão de Queijo", "pao"],
              ["Água", "agua"],
              ["Balde", "balde"],
              ["Geral", "geral"],
            ].map(([label, key]) => (
              <div
                key={key}
                className="flex items-center justify-between border-2 border-white/15 bg-black/35 px-3 py-3"
              >
                <span className="retro-copy-sm text-white/80">{label}</span>
                <span className="retro-label text-white">
                  {getParticipationCount(
                    key as "pao" | "agua" | "balde" | "geral",
                  )}
                  /{profiles.length}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="retro-panel">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            DESAFIO DIÁRIO
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/90">{dailyChallenge.title}</p>
            <p className="retro-copy-sm text-white/70">
              {dailyChallenge.description}
            </p>
            <div className="border-2 border-white/15 bg-black/35 p-3">
              <div className="retro-label text-white/70">CONCLUÍDO</div>
              <div className="pixel-text mt-2 text-[10px] text-white">
                {dailyChallenge.completedCount}/{profiles.length}
              </div>
            </div>
          </div>
        </section>

        <ParticipantRosterSection
          profiles={profiles}
          newName={newName}
          titleDrafts={titleDrafts}
          titlesByProfileId={titlesByProfileId}
          selectedMageId={selectedMageId}
          mageInsights={mageInsights}
          onOpenDraws={onOpenDraws}
          onAddName={onAddName}
          onNewNameChange={onNewNameChange}
          onOpenClassSelection={onOpenClassSelection}
          onOpenInventory={onOpenInventory}
          onToggleParticipation={onToggleParticipation}
          onTitleDraftChange={onTitleDraftChange}
          onSaveCustomTitle={onSaveCustomTitle}
          onRemoveProfile={onRemoveProfile}
          getExhaustionState={getExhaustionState}
          getCustomTitle={getCustomTitle}
          getClassPowerText={getClassPowerText}
          recentClassEffectsByProfileId={recentClassEffectsByProfileId}
        />

        <section className="retro-panel xl:col-span-2">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            NOVO FLUXO
          </h3>
          <div className="mt-4 space-y-3">
            <p className="retro-copy-sm text-white/85">
              1. Cadastre os participantes e ajuste quem participa de cada
              categoria.
            </p>
            <p className="retro-copy-sm text-white/85">
              2. Abra a página Sorteios para executar o turno do setor.
            </p>
            <p className="retro-copy-sm text-white/85">
              3. Os sorteios agora usam participação contínua. Não existe mais
              exclusão por ciclo no fluxo padrão.
            </p>
          </div>
        </section>

        {profiles.length === 0 && (
          <section className="retro-empty-state xl:col-span-2">
            <div className="retro-empty-icon">
              <User className="h-7 w-7 text-white/25" />
            </div>
            <p className="retro-copy text-white/70">
              O SETOR AINDA ESTÁ VAZIO.
              <br />
              CADASTRE O GRUPO PARA LIBERAR OS SORTEIOS.
            </p>
            {profilesLoadError ? (
              <p className="retro-copy-sm mt-3 border border-red-400/40 bg-red-950/25 px-3 py-2 text-red-200">
                {profilesLoadError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onOpenGuide}
              className="snes-ui-text border-2 border-white bg-black px-3 py-2 text-white hover:border-[var(--color-snes-gold)] hover:text-[var(--color-snes-gold)]"
            >
              ABRIR GUIA
            </button>
          </section>
        )}
      </div>
    </section>
  );
}
