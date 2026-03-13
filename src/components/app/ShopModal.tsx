import { AnimatePresence, motion } from "motion/react";
import { Coins, ShoppingCart, X } from "lucide-react";

import { Profile, ShopItem } from "../../types";

type ShopModalProps = {
  open: boolean;
  profiles: Profile[];
  shopItems: ShopItem[];
  selectedProfileId: string | null;
  getItemEffectText: (item: ShopItem) => string | null;
  onClose: () => void;
  onSelectProfile: (profileId: string) => void;
  onBuyItem: (profileId: string, itemId: string) => void;
};

export function ShopModal({
  open,
  profiles,
  shopItems,
  selectedProfileId,
  getItemEffectText,
  onClose,
  onSelectProfile,
  onBuyItem,
}: ShopModalProps) {
  return (
    <AnimatePresence>
      {open && (
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
            className="flex max-h-[80vh] w-full max-w-2xl flex-col border-4 border-white bg-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-3 font-display text-2xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <ShoppingCart className="h-6 w-6 text-yellow-500" />
                  Loja do Setor
                </h3>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
                  Gaste suas SetorCoins ($C) aqui.
                </p>
              </div>
              <button
                onClick={onClose}
                className="border-2 border-transparent p-2 text-zinc-500 transition-none hover:border-white hover:bg-black hover:text-white"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Fechar</span>
              </button>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Comprador:
              </label>
              <select
                className="w-full appearance-none border-2 border-zinc-800 bg-black px-4 py-3 text-white transition-none focus:border-white focus:outline-none"
                value={selectedProfileId || ""}
                onChange={(e) => onSelectProfile(e.target.value)}
              >
                <option value="" disabled>
                  Selecione um participante
                </option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.coins} $C)
                  </option>
                ))}
              </select>
            </div>

            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2">
              {shopItems.length === 0 ? (
                <div className="border-2 border-dashed border-zinc-800 py-12 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    A loja está vazia no momento.
                  </p>
                </div>
              ) : (
                shopItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-2 border-zinc-800 bg-black p-4 transition-none hover:border-white"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black uppercase tracking-wider text-white">
                          {item.name}
                        </h4>
                        <span className="border border-zinc-700 bg-zinc-900 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-zinc-400">
                          {item.type}
                        </span>
                      </div>
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">
                        {item.description}
                      </p>
                      {getItemEffectText(item) && (
                        <p className="pixel-text mt-2 text-[7px] text-cyan-300">
                          {getItemEffectText(item)}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 border-2 border-yellow-500 bg-black px-3 py-1 text-yellow-500">
                        <Coins className="h-4 w-4" />
                        <span className="font-black">{item.price}</span>
                      </div>
                      <button
                        disabled={
                          !selectedProfileId ||
                          (profiles.find((p) => p.id === selectedProfileId)
                            ?.coins || 0) < item.price
                        }
                        onClick={() =>
                          selectedProfileId && onBuyItem(selectedProfileId, item.id)
                        }
                        className={`border-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-none ${
                          !selectedProfileId ||
                          (profiles.find((p) => p.id === selectedProfileId)
                            ?.coins || 0) < item.price
                            ? "cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600"
                            : "border-white bg-yellow-600 text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-yellow-500 active:translate-y-[2px] active:shadow-none"
                        }`}
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
