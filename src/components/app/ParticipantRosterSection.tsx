import type { FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Coins,
  Coffee,
  Crosshair,
  Droplets,
  Heart,
  Package,
  PaintBucket,
  Shield,
  Star,
  Trash2,
  User,
  UserPlus,
  Wand2,
} from "lucide-react";

import { MageInsights, Profile } from "../../types";

type Category = "pao" | "agua" | "balde" | "geral";

type ParticipantRosterSectionProps = {
  profiles: Profile[];
  newName: string;
  titleDrafts: Record<string, string>;
  titlesByProfileId: Record<string, string[]>;
  selectedMageId: string | null;
  mageInsights: MageInsights | null;
  onOpenDraws: () => void;
  onAddName: (event: FormEvent) => void;
  onNewNameChange: (value: string) => void;
  onOpenClassSelection: (profileId: string) => void;
  onOpenInventory: (profileId: string) => void;
  onToggleParticipation: (profileId: string, category: Category) => void;
  onTitleDraftChange: (profileId: string, title: string) => void;
  onSaveCustomTitle: (profile: Profile) => void;
  onRemoveProfile: (profileId: string) => void;
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

export function ParticipantRosterSection({
  profiles,
  newName,
  titleDrafts,
  titlesByProfileId,
  selectedMageId,
  mageInsights,
  onOpenDraws,
  onAddName,
  onNewNameChange,
  onOpenClassSelection,
  onOpenInventory,
  onToggleParticipation,
  onTitleDraftChange,
  onSaveCustomTitle,
  onRemoveProfile,
  getExhaustionState,
  getCustomTitle,
  getClassPowerText,
  recentClassEffectsByProfileId,
}: ParticipantRosterSectionProps) {
  return (
    <section className="glass-card flex min-h-[0] flex-col p-5 xl:col-span-2">
      <div className="mb-5 flex flex-col gap-4 border-b-2 border-white/20 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="border-2 border-white bg-black/35 p-2.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <User className="w-5 h-5 text-[var(--color-snes-gold)]" />
          </div>
          <div>
            <h3 className="pixel-text text-[9px] text-[var(--color-snes-gold)]">
              ELENCO DO SETOR
            </h3>
            <p className="pixel-text mt-2 text-[7px] text-white/55">
              AJUSTE O GRUPO, OS PAPÉIS E A PARTICIPAÇÃO DE CADA UM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="snes-chip">{profiles.length} TOTAL</span>
          <button
            type="button"
            onClick={onOpenDraws}
            className="snes-ui-text border-2 border-white bg-[var(--color-snes-gold)] px-4 py-2 text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={profiles.length === 0}
          >
            ABRIR SORTEIOS
          </button>
        </div>
      </div>

      <form
        onSubmit={onAddName}
        className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]"
      >
        <div>
          <label className="pixel-text mb-2 block text-[8px] text-white/70">
            NOVO MEMBRO:
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            placeholder="NOME..."
            className="snes-input pixel-text w-full text-[9px] placeholder:text-white/35"
          />
        </div>
        <button
          type="submit"
          className="snes-ui-text mt-[22px] flex h-10 items-center justify-center gap-2 border-2 border-white bg-[var(--color-snes-gold)] px-4 text-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-white active:translate-y-1 active:shadow-none"
        >
          <UserPlus className="h-4 w-4" />
          ADICIONAR
        </button>
      </form>

      <div className="custom-scrollbar min-h-[320px] flex-1 overflow-y-auto pr-1">
        {profiles.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {profiles.map((person) => {
                const customTitle = getCustomTitle(person);
                const recentClassEffect =
                  recentClassEffectsByProfileId[person.id];
                const exhaustionState = getExhaustionState(person);
                const achievementTitles = titlesByProfileId[person.id] || [];
                const isArcaneFocus =
                  selectedMageId === person.id &&
                  ["mago", "aprendiz_mago"].includes(person.class) &&
                  Boolean(mageInsights);

                return (
                  <motion.div
                    key={person.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group relative overflow-hidden border-2 bg-black/35 p-2.5 transition-none snes-card-hover ${
                      exhaustionState.tone === "critical"
                        ? "border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.35)]"
                        : exhaustionState.tone === "warning"
                          ? "border-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.28)]"
                          : "border-white"
                    } ${recentClassEffect?.cardClassName || ""} ${
                      isArcaneFocus
                        ? "snes-arcane-glow border-blue-300 shadow-[0_0_18px_rgba(96,165,250,0.24)]"
                        : ""
                    }`}
                  >
                    <div className="absolute left-0 top-0 h-1 w-full border-b-2 border-white bg-black">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(person.xp / (person.level * 100)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 h-1.5 w-full border-t-2 border-white bg-black">
                      <div
                        className="h-full bg-red-600"
                        style={{
                          width: `${(person.hp / person.max_hp) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="mt-1.5 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenClassSelection(person.id)}
                              className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-white bg-black/60 text-zinc-300 transition-none hover:bg-white hover:text-black"
                              title="Mudar Classe"
                            >
                              {person.class === "guerreiro" && (
                                <Shield className="h-3 w-3 text-red-400" />
                              )}
                              {person.class === "aprendiz_guerreiro" && (
                                <Shield className="h-3 w-3 text-red-300" />
                              )}
                              {person.class === "mago" && (
                                <Wand2 className="h-3 w-3 text-blue-400" />
                              )}
                              {person.class === "aprendiz_mago" && (
                                <Wand2 className="h-3 w-3 text-blue-300" />
                              )}
                              {person.class === "ladino" && (
                                <Crosshair className="h-3 w-3 text-emerald-400" />
                              )}
                              {person.class === "aprendiz_ladino" && (
                                <Crosshair className="h-3 w-3 text-emerald-300" />
                              )}
                              {person.class === "clerigo" && (
                                <Heart className="h-3 w-3 text-pink-400" />
                              )}
                              {person.class === "aprendiz_clerigo" && (
                                <Heart className="h-3 w-3 text-pink-300" />
                              )}
                              {person.class === "novato" && (
                                <User className="h-3 w-3 text-zinc-400" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <div className="truncate text-[13px] font-semibold tracking-tight text-white">
                                {person.name}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                <span className="snes-chip">
                                  LV.{person.level}
                                </span>
                                <span
                                  className={`pixel-text border px-1.5 py-0.5 text-[6px] ${
                                    exhaustionState.tone === "critical"
                                      ? "border-red-300 bg-red-950/70 text-red-200"
                                      : exhaustionState.tone === "warning"
                                        ? "border-yellow-300 bg-yellow-950/50 text-yellow-200"
                                        : "border-emerald-300/40 bg-emerald-950/30 text-emerald-200/80"
                                  }`}
                                >
                                  {exhaustionState.label}
                                </span>
                                {recentClassEffect && (
                                  <span
                                    className={`pixel-text border px-1.5 py-0.5 text-[6px] ${recentClassEffect.badgeClassName}`}
                                  >
                                    {recentClassEffect.label}
                                  </span>
                                )}
                                {isArcaneFocus && (
                                  <span className="pixel-text border border-blue-300 bg-blue-950/55 px-1.5 py-0.5 text-[6px] text-blue-200">
                                    Arcano
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <div className="flex items-center gap-1 border-2 border-[var(--color-snes-gold)] bg-black px-2 py-1 text-[var(--color-snes-gold)]">
                            <Coins className="h-3 w-3" />
                            <span className="pixel-text text-[7px]">
                              {person.coins}
                            </span>
                          </div>
                          <button
                            onClick={() => onOpenInventory(person.id)}
                            className="border-2 border-white bg-black p-1 text-zinc-300 transition-none hover:bg-white hover:text-black"
                            title="Inventário"
                          >
                            <Package className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <div className="space-y-1">
                          <div className="pixel-text truncate text-[6px] text-white/60">
                            {customTitle || getClassPowerText(person.class)}
                          </div>
                          {(person.passive_coin_multiplier > 1 ||
                            person.temporary_coin_multiplier > 1 ||
                            person.luck > 0) && (
                            <div className="flex flex-wrap gap-1">
                              {person.passive_coin_multiplier > 1 && (
                                <span className="pixel-text border border-yellow-300 bg-yellow-950/45 px-1.5 py-0.5 text-[6px] text-yellow-200">
                                  Eco x
                                  {person.passive_coin_multiplier.toFixed(2)}
                                </span>
                              )}
                              {person.temporary_coin_multiplier > 1 && (
                                <span className="pixel-text border border-cyan-300 bg-cyan-950/45 px-1.5 py-0.5 text-[6px] text-cyan-200">
                                  Boost x
                                  {person.temporary_coin_multiplier.toFixed(2)}
                                </span>
                              )}
                              {person.luck > 0 && (
                                <span className="pixel-text border border-blue-300 bg-blue-950/45 px-1.5 py-0.5 text-[6px] text-blue-200">
                                  Sorte +{person.luck.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-1">
                          <button
                            onClick={() =>
                              onToggleParticipation(person.id, "pao")
                            }
                            className={`border-2 p-1 transition-none ${
                              person.participates_in_pao
                                ? "border-white bg-orange-600 text-white"
                                : "border-zinc-700 bg-black text-zinc-700 hover:border-white hover:text-white"
                            }`}
                            title="Participar do Pão de Queijo"
                          >
                            <Coffee className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() =>
                              onToggleParticipation(person.id, "agua")
                            }
                            className={`border-2 p-1 transition-none ${
                              person.participates_in_agua
                                ? "border-white bg-blue-600 text-white"
                                : "border-zinc-700 bg-black text-zinc-700 hover:border-white hover:text-white"
                            }`}
                            title="Participar da Água"
                          >
                            <Droplets className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() =>
                              onToggleParticipation(person.id, "balde")
                            }
                            className={`border-2 p-1 transition-none ${
                              person.participates_in_balde
                                ? "border-white bg-purple-600 text-white"
                                : "border-zinc-700 bg-black text-zinc-700 hover:border-white hover:text-white"
                            }`}
                            title="Participar do Balde"
                          >
                            <PaintBucket className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() =>
                              onToggleParticipation(person.id, "geral")
                            }
                            className={`border-2 p-1 transition-none ${
                              person.participates_in_geral
                                ? "border-white bg-emerald-600 text-white"
                                : "border-zinc-700 bg-black text-zinc-700 hover:border-white hover:text-white"
                            }`}
                            title="Participar do Geral"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {!customTitle && (
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={titleDrafts[person.id] || ""}
                            onChange={(e) =>
                              onTitleDraftChange(person.id, e.target.value)
                            }
                            maxLength={40}
                            placeholder="Titulo pessoal..."
                            className="snes-input pixel-text h-7 flex-1 px-2 py-1 text-[6px] placeholder:text-white/30"
                          />
                          <button
                            type="button"
                            onClick={() => onSaveCustomTitle(person)}
                            className="snes-ui-text border-2 border-white bg-black px-2 text-white hover:border-[var(--color-snes-gold)] hover:text-[var(--color-snes-gold)]"
                          >
                            SALVAR
                          </button>
                        </div>
                      )}

                      {achievementTitles.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="pixel-text text-[6px] text-white/45">
                            FEITOS
                          </span>
                          {achievementTitles.map((title) => (
                            <span
                              key={`${person.id}-${title}`}
                              className="pixel-text border border-[var(--color-snes-gold)]/70 bg-black/45 px-1.5 py-0.5 text-[6px] text-[var(--color-snes-gold)]/90"
                            >
                              {title}
                            </span>
                          ))}
                        </div>
                      )}

                      {recentClassEffect && (
                        <div className="pixel-text text-[6px] text-white/70">
                          {recentClassEffect.detail}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onRemoveProfile(person.id)}
                      className="absolute bottom-1.5 left-2 border-2 border-transparent p-1 text-zinc-500 opacity-0 transition-none group-hover:opacity-100 hover:border-red-500 hover:bg-black hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        ) : (
          <div className="retro-empty-state">
            <div className="retro-empty-icon">
              <User className="h-7 w-7 text-white/25" />
            </div>
            <p className="pixel-text text-[8px] text-white/50">
              EQUIPE VAZIA.
              <br />
              ADICIONE NOMES PARA LUTAR!
            </p>
            <button
              type="button"
              className="snes-ui-text border-2 border-white bg-slate-700 px-3 py-2 text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-slate-600"
            >
              Importar Lista
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
