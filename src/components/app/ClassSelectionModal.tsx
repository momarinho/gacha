import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Profile, ProfileClass } from "../../types";

type ClassSelectionModalProps = {
  open: boolean;
  profile: Profile | null;
  apprenticeUnlockLevel: number;
  finalClassUnlockLevel: number;
  getClassLabel: (profileClass: ProfileClass) => string;
  getClassProgressionOptions: (profile: Profile) => ProfileClass[];
  classOptionMeta: Record<
    string,
    {
      label: string;
      description: string;
      tone: string;
      icon: ReactNode;
    }
  >;
  onChangeClass: (profileId: string, nextClass: ProfileClass) => void;
  onAllocateStat: (
    profileId: string,
    stat:
      | "stat_foco"
      | "stat_resiliencia"
      | "stat_networking"
      | "stat_malandragem",
  ) => void;
  onClose: () => void;
};

export function ClassSelectionModal({
  open,
  profile,
  apprenticeUnlockLevel,
  finalClassUnlockLevel,
  getClassLabel,
  getClassProgressionOptions,
  classOptionMeta,
  onChangeClass,
  onAllocateStat,
  onClose,
}: ClassSelectionModalProps) {
  return (
    <AnimatePresence>
      {open && profile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border-4 border-white bg-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]"
          >
            <h3 className="mb-2 text-center font-display text-xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              Progresso de Classe
            </h3>
            <p className="mb-6 text-center text-[10px] uppercase tracking-widest text-zinc-400">
              {profile.name} está como {getClassLabel(profile.class)}.{" "}
              {profile.class === "novato"
                ? profile.level >= apprenticeUnlockLevel
                  ? "Promovido. Escolha sua trilha de aprendiz."
                  : `Alcance o nível ${apprenticeUnlockLevel} para escolher sua trilha.`
                : profile.class.startsWith("aprendiz_")
                  ? profile.level >= finalClassUnlockLevel
                    ? "Evolução liberada. Conclua sua classe final."
                    : `Alcance o nível ${finalClassUnlockLevel} para concluir sua classe final.`
                  : "Classe final já definida."}
            </p>

            {profile.class === "novato" && (
              <div className="mb-4 border-2 border-white/20 bg-black/30 p-3 text-center">
                <div className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
                  PASSIVA DE NOVATO
                </div>
                <div className="pixel-text mt-2 text-[7px] text-white/65">
                  +10% XP enquanto aprende o sistema
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="border-2 border-white/15 bg-black/30 p-4">
                <div className="mb-3">
                  <div className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
                    TRILHA DE CLASSE
                  </div>
                </div>

                {getClassProgressionOptions(profile).length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {getClassProgressionOptions(profile).map((classOption) => {
                      const meta = classOptionMeta[classOption];
                      return (
                        <button
                          key={classOption}
                          onClick={() => onChangeClass(profile.id, classOption)}
                          className={`group flex flex-col items-center gap-3 border-2 border-zinc-800 bg-black p-4 transition-none ${meta.tone}`}
                        >
                          <div className="border-2 border-transparent bg-black/30 p-3 transition-none group-hover:border-white">
                            {meta.icon}
                          </div>
                          <div className="text-center">
                            <span className="block text-sm font-black uppercase tracking-widest text-white">
                              {meta.label}
                            </span>
                            <span className="mt-2 block text-[8px] uppercase tracking-wider text-zinc-500">
                              {meta.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/20 p-5 text-center">
                    <div className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
                      PROGRESSÃO BLOQUEADA
                    </div>
                    <div className="pixel-text mt-2 text-[7px] text-white/55">
                      Aguarde o próximo marco de nível para evoluir.
                    </div>
                  </div>
                )}
              </section>

              <section className="border-2 border-emerald-500/35 bg-emerald-950/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="pixel-text text-[8px] text-emerald-300">
                      ATRIBUTOS
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/45">
                      Pontos livres: {profile.stat_points || 0}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      key: "stat_foco" as const,
                      label: "FOCO",
                      value: profile.stat_foco || 0,
                      detail: "+0.5 XP base por resultado",
                    },
                    {
                      key: "stat_resiliencia" as const,
                      label: "RESILIENCIA",
                      value: profile.stat_resiliencia || 0,
                      detail: "+1 HP maximo e +1 HP imediato",
                    },
                    {
                      key: "stat_networking" as const,
                      label: "NETWORKING",
                      value: profile.stat_networking || 0,
                      detail: "+0.5% no ganho passivo de moedas",
                    },
                    {
                      key: "stat_malandragem" as const,
                      label: "MALANDRAGEM",
                      value: profile.stat_malandragem || 0,
                      detail: "+0.5% de chance de esquiva",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.key}
                      className="border border-white/15 bg-black/35 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="pixel-text text-[8px] text-white">
                          {stat.label}
                        </span>
                        <span className="retro-label border border-[var(--color-snes-gold)] bg-black px-2 py-0.5 text-[var(--color-snes-gold)]">
                          {stat.value}
                        </span>
                      </div>
                      <p className="mb-3 text-[10px] uppercase tracking-wider text-white/55">
                        {stat.detail}
                      </p>
                      <button
                        type="button"
                        onClick={() => onAllocateStat(profile.id, stat.key)}
                        disabled={(profile.stat_points || 0) <= 0}
                        className="w-full border-2 border-white bg-black px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-none hover:border-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        Distribuir ponto
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full border-2 border-zinc-800 bg-black py-3 font-black uppercase tracking-widest text-zinc-500 transition-none hover:border-white hover:text-white"
            >
              Cancelar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
