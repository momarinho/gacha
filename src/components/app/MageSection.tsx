import { Wand2 } from "lucide-react";

import { MageInsights, Profile } from "../../types";

type MageSectionProps = {
  mageProfiles: Profile[];
  mageInsights: MageInsights | null;
  selectedMageId: string | null;
  onSelectMage: (mageId: string) => void;
};

export function MageSection({
  mageProfiles,
  mageInsights,
  selectedMageId,
  onSelectMage,
}: MageSectionProps) {
  if (mageProfiles.length === 0) return null;

  return (
    <section
      className={`glass-card p-5 ${
        mageInsights && selectedMageId ? "snes-arcane-glow" : ""
      }`}
    >
      <div className="mb-4 flex items-center justify-between border-b border-white/20 pb-3">
        <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
          OLHAR ARCANO
        </h2>
        <Wand2 className="h-4 w-4 text-[var(--color-snes-gold)]" />
      </div>

      <div className="mb-4">
        <label className="retro-label mb-2 block text-white/80">
          MAGO ATIVO:
        </label>
        <select
          className="snes-input retro-copy-sm w-full text-white"
          value={selectedMageId || ""}
          onChange={(e) => onSelectMage(e.target.value)}
        >
          {mageProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </div>

      {mageInsights ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {mageInsights.queues.map((queue) => (
              <div
                key={queue.key}
                className="border-2 border-white/20 bg-black/30 p-3"
              >
                <div className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
                  {queue.label}
                </div>
                <div className="retro-copy-sm mt-2 text-white/80">
                  FILA: {queue.excludedNames.length}
                </div>
                <div className="mt-2 min-h-9 space-y-1">
                  {queue.excludedNames.length > 0 ? (
                    queue.excludedNames.slice(0, 3).map((name) => (
                      <div
                        key={`${queue.key}-${name}`}
                        className="retro-copy-sm truncate text-white"
                      >
                        {name}
                      </div>
                    ))
                  ) : (
                    <div className="retro-copy-sm text-white/55">LIMPA</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-2 border-white/20 bg-black/30 p-3">
            <div className="pixel-text mb-3 text-[8px] text-[var(--color-snes-gold)]">
              LOG DETALHADO
            </div>
            <div className="space-y-2">
              {mageInsights.recentLogs.slice(0, 4).map((entry) => (
                <div
                  key={entry.id}
                  className="border-l-2 border-[var(--color-snes-gold)] bg-white/5 px-2 py-2"
                >
                  <div className="retro-copy text-white">
                    {entry.profiles?.name || "SISTEMA"}
                  </div>
                  <div className="retro-copy-sm mt-1 text-white/80">
                    {entry.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-white/20 p-6 text-center">
          <p className="retro-copy text-white/70">SEM LEITURA ARCANA</p>
        </div>
      )}
    </section>
  );
}
