import test from "node:test";
import assert from "node:assert/strict";

import { getBannerForShopItem } from "../shared/shopBannerLogic.js";

test("itens de pao e balde vao para o banner catastrofe", () => {
  assert.equal(
    getBannerForShopItem({
      effect_code: "TRANSFER_PAO",
      target_category: "pao",
    }),
    "catastrophe",
  );

  assert.equal(
    getBannerForShopItem({
      effect_code: "SKIP_BALDE_NEXT",
      target_category: "balde",
    }),
    "catastrophe",
  );
});

test("itens de agua, solo e economia vao para o banner padrao", () => {
  assert.equal(
    getBannerForShopItem({
      effect_code: "OUTSOURCE_AGUA",
      target_category: "agua",
    }),
    "standard",
  );

  assert.equal(
    getBannerForShopItem({
      effect_code: "SOLO_REWARD_BOOST",
      target_category: null,
    }),
    "standard",
  );

  assert.equal(
    getBannerForShopItem({
      effect_code: "COIN_MAGNET",
      target_category: null,
    }),
    "standard",
  );
});
