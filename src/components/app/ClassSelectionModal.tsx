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
            className="max-w-md w-full border-4 border-white bg-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]"
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

            {getClassProgressionOptions(profile).length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
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
