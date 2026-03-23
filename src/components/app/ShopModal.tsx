import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Coins, Sparkles, ShoppingCart, X } from "lucide-react";

import { getBannerForShopItem } from "../../../shared/shopBannerLogic";
import {
  getItemActivationLabel,
  getShopBannerLabel,
  getShopPityCount,
  getShopPullPrice,
  getShopRarityLabel,
} from "../../app/helpers";
import { Profile, ShopBanner, ShopItem, ShopPullResult } from "../../types";

type ShopModalProps = {
  open: boolean;
  profiles: Profile[];
  shopItems: ShopItem[];
  selectedProfileId: string | null;
  getItemEffectText: (item: ShopItem) => string | null;
  onClose: () => void;
  onSelectProfile: (profileId: string) => void;
  onPullItems: (
    profileId: string,
    count: 1 | 10,
    banner: ShopBanner,
  ) => Promise<ShopPullResult>;
};

const STANDARD_BANNER_RATES = [
  { rarity: "common", label: "Comum", chance: "88%" },
  { rarity: "rare", label: "Raro", chance: "9%" },
  { rarity: "epic", label: "Épico", chance: "2.4%" },
  { rarity: "legendary", label: "Lendário", chance: "0.6%" },
] as const;

const CATASTROPHE_BANNER_RATES = [
  { rarity: "common", label: "Comum", chance: "82%" },
  { rarity: "rare", label: "Raro", chance: "12%" },
  { rarity: "epic", label: "Épico", chance: "5%" },
  { rarity: "legendary", label: "Lendário", chance: "1%" },
] as const;

const rarityToneClassName: Record<string, string> = {
  common: "border-white/15 bg-zinc-950 text-zinc-200",
  rare: "border-sky-500/40 bg-sky-950/40 text-sky-200",
  epic: "border-fuchsia-500/40 bg-fuchsia-950/40 text-fuchsia-200",
  legendary: "border-amber-400/50 bg-amber-950/40 text-amber-200",
};

export function ShopModal({
  open,
  profiles,
  shopItems,
  selectedProfileId,
  getItemEffectText,
  onClose,
  onSelectProfile,
  onPullItems,
}: ShopModalProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [lastResult, setLastResult] = useState<ShopPullResult | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<ShopBanner>("standard");

  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) || null;
  const singlePullPrice = getShopPullPrice(selectedProfile, 1);
  const multiPullPrice = getShopPullPrice(selectedProfile, 10);
  const currentRarePity =
    lastResult?.banner === selectedBanner
      ? lastResult.pityToRare
      : getShopPityCount(selectedProfile, "rare", selectedBanner);
  const currentLegendaryPity =
    lastResult?.banner === selectedBanner
      ? lastResult.pityToLegendary
      : getShopPityCount(selectedProfile, "legendary", selectedBanner);

  const bannerItems = useMemo(() => {
    return shopItems.filter((item) => {
      const isCatastrophe = getBannerForShopItem(item) === "catastrophe";
      return selectedBanner === "catastrophe" ? isCatastrophe : !isCatastrophe;
    });
  }, [selectedBanner, shopItems]);

  const itemsByRarity = useMemo(() => {
    return bannerItems.reduce<Record<string, ShopItem[]>>((acc, item) => {
      const rarity = item.rarity || "common";
      if (!acc[rarity]) acc[rarity] = [];
      acc[rarity].push(item);
      return acc;
    }, {});
  }, [bannerItems]);

  const bannerRates =
    selectedBanner === "catastrophe"
      ? CATASTROPHE_BANNER_RATES
      : STANDARD_BANNER_RATES;

  const handlePull = async (count: 1 | 10) => {
    if (!selectedProfileId || isPulling) return;

    setIsPulling(true);
    try {
      const result = await onPullItems(
        selectedProfileId,
        count,
        selectedBanner,
      );
      setLastResult(result);
    } finally {
      setIsPulling(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setLastResult(null);
      return;
    }
  }, [open]);

  useEffect(() => {
    setLastResult(null);
  }, [selectedProfileId, selectedBanner]);

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
            className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden border-4 border-white bg-black shadow-[8px_8px_0px_rgba(0,0,0,1)]"
          >
            <div className="border-b-4 border-white bg-[radial-gradient(circle_at_top,#3f1d0a,transparent_55%),linear-gradient(135deg,#151515,#040404)] p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-3 font-display text-2xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <ShoppingCart className="h-6 w-6 text-yellow-500" />
                    Banner do Setor
                  </h3>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.35em] text-zinc-400">
                    {selectedBanner === "catastrophe"
                      ? "Pool de crise para Pão, Balde e itens de salvamento."
                      : "Pool geral para Água, economia, sorte e progressão."}
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

              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="border-2 border-white/15 bg-black/45 p-4">
                  <div className="mb-4 flex gap-2">
                    {(["standard", "catastrophe"] as const).map((banner) => (
                      <button
                        key={banner}
                        type="button"
                        onClick={() => setSelectedBanner(banner)}
                        className={`border-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.25em] ${
                          selectedBanner === banner
                            ? banner === "catastrophe"
                              ? "border-red-300 bg-red-700 text-white"
                              : "border-yellow-300 bg-yellow-600 text-black"
                            : "border-zinc-800 bg-black text-zinc-400 hover:border-white hover:text-white"
                        }`}
                      >
                        {getShopBannerLabel(banner)}
                      </button>
                    ))}
                  </div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Invocador:
                  </label>
                  <select
                    className="w-full appearance-none border-2 border-zinc-800 bg-black px-4 py-3 text-white transition-none focus:border-white focus:outline-none"
                    value={selectedProfileId || ""}
                    onChange={(e) => onSelectProfile(e.target.value)}
                  >
                    <option value="" disabled>
                      Selecione um participante
                    </option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} ({profile.coins} $C)
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {bannerRates.map((entry) => (
                      <div
                        key={entry.rarity}
                        className={`border px-3 py-3 text-center ${rarityToneClassName[entry.rarity]}`}
                      >
                        <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                          {entry.label}
                        </p>
                        <p className="mt-2 font-display text-2xl font-black">
                          {entry.chance}
                        </p>
                      </div>
                    ))}
                    <div
                      className={`border px-3 py-3 text-center ${
                        selectedBanner === "catastrophe"
                          ? "border-red-500/35 bg-red-950/35 text-red-200"
                          : "border-emerald-500/35 bg-emerald-950/35 text-emerald-200"
                      }`}
                    >
                      <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                        Garantia
                      </p>
                      <p className="mt-2 text-[10px] uppercase tracking-wider">
                        Raro+ em 10
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider">
                        Lendário em 90
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-yellow-500/40 bg-black/55 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">
                    Custos do Banner
                  </p>
                  <div className="mt-4 space-y-3">
                    <button
                      disabled={
                        isPulling ||
                        !selectedProfile ||
                        selectedProfile.coins < singlePullPrice
                      }
                      onClick={() => handlePull(1)}
                      className="flex w-full items-center justify-between border-2 border-white bg-yellow-600 px-4 py-4 text-left text-white shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-none hover:bg-yellow-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:shadow-none"
                    >
                      <span>
                        <span className="block text-[10px] font-black uppercase tracking-[0.3em]">
                          Pull x1
                        </span>
                        <span className="mt-1 block text-[10px] uppercase tracking-wider text-yellow-100">
                          Ideal para testar pity
                        </span>
                      </span>
                      <span className="flex items-center gap-2 font-display text-2xl font-black">
                        <Coins className="h-5 w-5" />
                        {singlePullPrice}
                      </span>
                    </button>

                    <button
                      disabled={
                        isPulling ||
                        !selectedProfile ||
                        selectedProfile.coins < multiPullPrice
                      }
                      onClick={() => handlePull(10)}
                      className="flex w-full items-center justify-between border-2 border-fuchsia-400 bg-fuchsia-700 px-4 py-4 text-left text-white shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-none hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:shadow-none"
                    >
                      <span>
                        <span className="block text-[10px] font-black uppercase tracking-[0.3em]">
                          Pull x10
                        </span>
                        <span className="mt-1 block text-[10px] uppercase tracking-wider text-fuchsia-100">
                          Garante raro ou melhor
                        </span>
                      </span>
                      <span className="flex items-center gap-2 font-display text-2xl font-black">
                        <Coins className="h-5 w-5" />
                        {multiPullPrice}
                      </span>
                    </button>
                  </div>

                  {selectedProfile && (
                    <div className="mt-4 border-2 border-white/15 bg-black/40 p-3 text-[10px] uppercase tracking-wider text-zinc-300">
                      <p>
                        Saldo atual:{" "}
                        <span className="font-black">
                          {selectedProfile.coins} $C
                        </span>
                      </p>
                      <p className="mt-2">
                        Pity raro+:{" "}
                        <span className="font-black">{currentRarePity}/10</span>
                      </p>
                      <p className="mt-1">
                        Pity lendário:{" "}
                        <span className="font-black">
                          {currentLegendaryPity}/90
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="custom-scrollbar min-h-0 overflow-y-auto border-r-4 border-white/10 p-5">
                <div className="mb-4 flex items-center gap-2 text-white">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.35em]">
                    Pool do Banner {getShopBannerLabel(selectedBanner)}
                  </h4>
                </div>

                <div className="space-y-4">
                  {(["legendary", "epic", "rare", "common"] as const).map(
                    (rarity) => (
                      <section key={rarity}>
                        <div
                          className={`mb-3 inline-flex border px-3 py-2 text-[9px] font-black uppercase tracking-[0.3em] ${rarityToneClassName[rarity]}`}
                        >
                          {getShopRarityLabel(rarity)}
                        </div>

                        <div className="space-y-3">
                          {(itemsByRarity[rarity] || []).map((item) => (
                            <div
                              key={item.id}
                              className="border-2 border-zinc-800 bg-zinc-950/70 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-black uppercase tracking-wider text-white">
                                    {item.name}
                                  </p>
                                  <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-amber-300">
                                    {getItemActivationLabel(item)}
                                  </p>
                                  <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">
                                    {item.description}
                                  </p>
                                  {getItemEffectText(item) && (
                                    <p className="mt-2 text-[9px] uppercase tracking-wider text-cyan-300">
                                      {getItemEffectText(item)}
                                    </p>
                                  )}
                                </div>
                                <div className="shrink-0 border border-yellow-500/40 bg-black px-2 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-yellow-300">
                                  valor {item.price}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ),
                  )}
                </div>
              </div>

              <div className="custom-scrollbar min-h-0 overflow-y-auto bg-[linear-gradient(180deg,#130a02,#050505)] p-5">
                <div className="mb-4 flex items-center gap-2 text-white">
                  <Sparkles className="h-4 w-4 text-fuchsia-400" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.35em]">
                    Resultado
                  </h4>
                </div>

                {!lastResult ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center border-2 border-dashed border-white/15 bg-black/30 px-6 text-center">
                    <p className="font-display text-2xl font-black text-white">
                      Nenhum pull ainda
                    </p>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                      Faça um pull para revelar os drops.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-white/15 bg-black/40 p-4 text-[10px] uppercase tracking-wider text-zinc-300">
                      <p>
                        Banner:{" "}
                        <span className="font-black text-orange-300">
                          {getShopBannerLabel(lastResult.banner)}
                        </span>
                      </p>
                      <p>
                        Gastou:{" "}
                        <span className="font-black text-yellow-300">
                          {lastResult.spentCoins} $C
                        </span>
                      </p>
                      <p className="mt-1">
                        Pulls:{" "}
                        <span className="font-black">
                          {lastResult.totalPulls}
                        </span>
                      </p>
                      <p className="mt-1">
                        Próximo raro+ em:{" "}
                        <span className="font-black">
                          {Math.max(0, 10 - lastResult.pityToRare)}
                        </span>
                      </p>
                      <p className="mt-1">
                        Próximo lendário em:{" "}
                        <span className="font-black">
                          {Math.max(0, 90 - lastResult.pityToLegendary)}
                        </span>
                      </p>
                    </div>

                    {lastResult.drops.map((drop, index) => (
                      <div
                        key={`${drop.item.id}-${index}`}
                        className={`border-2 p-4 ${
                          drop.rarity === "legendary"
                            ? "border-amber-400 bg-amber-950/30"
                            : drop.rarity === "epic"
                              ? "border-fuchsia-400 bg-fuchsia-950/25"
                              : drop.rarity === "rare"
                                ? "border-sky-400 bg-sky-950/25"
                                : "border-zinc-800 bg-black/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black uppercase tracking-wider text-white">
                              {drop.item.name}
                            </p>
                            <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-zinc-400">
                              {getShopRarityLabel(drop.rarity)}
                              {drop.isGuaranteed ? " • pity" : ""}
                            </p>
                            <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-amber-300">
                              {getItemActivationLabel(drop.item)}
                            </p>
                            <p className="mt-3 text-[10px] uppercase tracking-wider text-zinc-500">
                              {drop.item.description}
                            </p>
                            {getItemEffectText(drop.item) && (
                              <p className="mt-2 text-[9px] uppercase tracking-wider text-cyan-300">
                                {getItemEffectText(drop.item)}
                              </p>
                            )}
                          </div>
                          <div className="border border-white/20 bg-black/40 px-2 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-white">
                            {drop.item.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
