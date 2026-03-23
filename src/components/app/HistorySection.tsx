import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Clock, History, ShoppingCart, Star } from "lucide-react";

import { BattleLog } from "../../types";

type HistorySectionProps = {
  battleLogs: BattleLog[];
  onClear: () => void;
};

export function HistorySection({ battleLogs, onClear }: HistorySectionProps) {
  return (
    <section className="glass-card flex min-h-[420px] flex-col p-5 lg:min-h-[calc(100vh-170px)] lg:p-6">
      <div className="mb-6 flex items-center justify-between border-b-2 border-white/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="border-2 border-white bg-black/35 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <History className="h-5 w-5 text-[var(--color-snes-gold)]" />
          </div>
          <div>
            <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
              HISTÓRICO DE SORTEIOS
            </h2>
            <p className="retro-copy-sm mt-2 text-white/75">
              REGISTROS DAS ÚLTIMAS ATIVIDADES
            </p>
          </div>
        </div>
        {battleLogs.length > 0 && (
          <button
            onClick={onClear}
            className="snes-ui-text border-2 border-white bg-black/35 px-3 py-2 text-white/70 hover:border-[var(--color-snes-gold)] hover:text-white"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2">
        <AnimatePresence mode="popLayout">
          {battleLogs.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="history-log-entry"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center border-2 border-white ${
                  entry.event_type === "draw_result"
                    ? "bg-[var(--color-snes-gold)] text-slate-950"
                    : entry.event_type === "draw_rewards"
                      ? "bg-blue-500 text-slate-950"
                      : entry.event_type === "training_draw"
                        ? "bg-yellow-500 text-slate-950"
                        : entry.event_type === "level_up"
                          ? "bg-emerald-600 text-white"
                          : ["item_buy", "gacha_pull"].includes(
                                entry.event_type,
                              )
                            ? "bg-blue-600 text-white"
                            : "bg-black/40 text-white"
                }`}
              >
                {["draw_result", "training_draw"].includes(
                  entry.event_type,
                ) && <Star className="h-4 w-4" />}
                {entry.event_type === "draw_rewards" && (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {entry.event_type === "level_up" && (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {["item_buy", "gacha_pull"].includes(entry.event_type) && (
                  <ShoppingCart className="h-4 w-4" />
                )}
                {![
                  "draw_result",
                  "draw_rewards",
                  "training_draw",
                  "level_up",
                  "item_buy",
                  "gacha_pull",
                ].includes(entry.event_type) && <History className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="retro-copy text-white">
                  {entry.profiles?.name || "SISTEMA"}
                </div>
                <div className="retro-copy-sm text-white/80">
                  {entry.message}
                </div>
              </div>
              <div className="retro-label flex items-center gap-1 text-white/65">
                <Clock className="h-3 w-3" />
                {new Date(entry.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {battleLogs.length === 0 && (
          <div className="retro-empty-state mt-4">
            <div className="retro-empty-icon">
              <History className="h-7 w-7 text-white/25" />
            </div>
            <p className="retro-copy text-white/55">FIM DOS REGISTROS</p>
          </div>
        )}
      </div>
    </section>
  );
}
