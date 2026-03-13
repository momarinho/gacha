import type { ReactNode } from "react";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Shuffle } from "lucide-react";

type DrawCategoryCardProps = {
  title: string;
  meta: string;
  progressColorClass: string;
  winnerColorClass: string;
  emptyState: ReactNode;
  participationCount: number;
  totalProfiles: number;
  progressWidth: number;
  isDrawing: boolean;
  cyclingName: string;
  winners: string[];
  winnerHeading: string;
  onDraw: () => void;
  disabled?: boolean;
  headerExtras?: ReactNode;
};

export function DrawCategoryCard({
  title,
  meta,
  progressColorClass,
  winnerColorClass,
  emptyState,
  participationCount,
  totalProfiles,
  progressWidth,
  isDrawing,
  cyclingName,
  winners,
  winnerHeading,
  onDraw,
  disabled,
  headerExtras,
}: DrawCategoryCardProps) {
  return (
    <section className="draw-card group">
      <div className="draw-card-header">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="draw-card-title">{title}</h2>
            <div className="draw-card-meta">{meta}</div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="draw-card-progress w-44">
                  <motion.div
                    className={`h-full ${progressColorClass}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressWidth}%` }}
                  />
                </div>
                <span className="pixel-text border-2 border-white bg-black px-2 py-1 text-[7px] text-white">
                  {participationCount}/{totalProfiles}
                </span>
              </div>
              {headerExtras}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDraw}
            disabled={disabled}
            className="draw-card-action disabled:rpg-button-disabled"
          >
            <Shuffle className={`w-5 h-5 ${isDrawing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="draw-card-screen">
        <AnimatePresence mode="wait">
          {isDrawing ? (
            <motion.div
              key={`drawing-${title}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center gap-4"
            >
              <div
                className={`text-3xl font-black tracking-tighter font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] md:text-4xl ${winnerColorClass}`}
              >
                {cyclingName}
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      delay: i * 0.2,
                    }}
                    className={`h-2 w-2 ${winnerColorClass.replace("text-", "bg-")}`}
                  />
                ))}
              </div>
            </motion.div>
          ) : winners.length > 0 ? (
            <motion.div
              key={`winner-${title}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-3 flex items-center justify-center gap-2 text-white"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {winnerHeading}
                </span>
              </motion.div>
              <div className="flex flex-col gap-2">
                {winners.map((winner, idx) => (
                  <motion.div
                    key={winner}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: 0.3 + idx * 0.1,
                      type: "spring",
                    }}
                    className={`text-3xl font-black tracking-tighter font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] md:text-4xl ${winnerColorClass}`}
                  >
                    {winner}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            emptyState
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
