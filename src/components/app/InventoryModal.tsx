import { AnimatePresence, motion } from "motion/react";
import { Package, X } from "lucide-react";

import { Profile, ShopItem } from "../../types";

type InventoryModalProps = {
  open: boolean;
  profile: Profile | null;
  shopItems: ShopItem[];
  getItemEffectText: (item: ShopItem) => string | null;
  onClose: () => void;
  onUseItem: (profileId: string, itemId: string) => void;
};

export function InventoryModal({
  open,
  profile,
  shopItems,
  getItemEffectText,
  onClose,
  onUseItem,
}: InventoryModalProps) {
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
            className="flex max-h-[80vh] w-full max-w-2xl flex-col border-4 border-white bg-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-3 font-display text-2xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <Package className="h-6 w-6 text-emerald-500" />
                  Inventário
                </h3>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
                  {profile.name}
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

            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2">
              {!profile.inventory || profile.inventory.length === 0 ? (
                <div className="border-2 border-dashed border-zinc-800 py-12 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    O inventário está vazio.
                  </p>
                </div>
              ) : (
                profile.inventory.map((invItem) => {
                  const itemDetails = shopItems.find(
                    (si) => si.id === invItem.item_id,
                  );
                  if (!itemDetails) return null;

                  return (
                    <div
                      key={invItem.item_id}
                      className="flex items-center justify-between border-2 border-zinc-800 bg-black p-4 transition-none hover:border-white"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black uppercase tracking-wider text-white">
                            {itemDetails.name}
                          </h4>
                          <span className="border border-zinc-700 bg-zinc-900 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-zinc-400">
                            {itemDetails.type}
                          </span>
                          <span className="border border-indigo-500 bg-indigo-900 px-2 py-1 text-[8px] font-black text-indigo-400">
                            x{invItem.qty}
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">
                          {itemDetails.description}
                        </p>
                        {getItemEffectText(itemDetails) && (
                          <p className="pixel-text mt-2 text-[7px] text-cyan-300">
                            {getItemEffectText(itemDetails)}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <button
                          onClick={() => onUseItem(profile.id, itemDetails.id)}
                          className="border-2 border-white bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-none hover:bg-emerald-500 active:translate-y-[2px] active:shadow-none"
                        >
                          Usar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
