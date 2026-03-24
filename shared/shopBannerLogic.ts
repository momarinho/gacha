export type ShopBanner = "standard" | "catastrophe";

type BannerItemShape = {
  effect_code: string;
  target_category?: "pao" | "agua" | "balde" | "geral" | null;
};

const CATASTROPHE_EFFECTS = new Set([
  "TRANSFER_PAO",
  "AUTO_TRANSFER_PAO",
  "SKIP_BALDE_NEXT",
  "AUTO_BALDE_SHIELD",
  "HEAL_PERCENT_50",
]);

export function getBannerForShopItem(item: BannerItemShape): ShopBanner {
  if (
    item.target_category === "pao" ||
    item.target_category === "balde" ||
    CATASTROPHE_EFFECTS.has(item.effect_code)
  ) {
    return "catastrophe";
  }

  return "standard";
}
