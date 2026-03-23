import test from "node:test";
import assert from "node:assert/strict";

import { api } from "../src/services/api";
import { localApi } from "../src/services/localApi";
import type { Profile, ShopItem } from "../src/types";

const LOCAL_DB_KEY = "devgacha_local_db_v1";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

function makeProfile(id: string, overrides: Partial<Profile> = {}): Profile {
  return {
    id,
    name: `Profile ${id}`,
    class: "novato",
    level: 1,
    xp: 0,
    coins: 50,
    hp: 100,
    max_hp: 100,
    luck: 0,
    titles: [],
    passive_coin_multiplier: 1,
    temporary_coin_multiplier: 1,
    exhaustion_threshold: 0.3,
    exhaustion_penalty_multiplier: 0.5,
    inventory: [],
    active_buffs: [],
    daily_challenge_state: null,
    participates_in_pao: true,
    participates_in_agua: true,
    participates_in_balde: true,
    participates_in_geral: true,
    stat_points: 0,
    stat_foco: 0,
    stat_resiliencia: 0,
    stat_networking: 0,
    stat_malandragem: 0,
    created_at: "2026-03-23T12:00:00-03:00",
    ...overrides,
  };
}

function makeMogadoItem(): ShopItem {
  return {
    id: "shop-mogado-badge",
    name: "Selo Mogado",
    description:
      "Aplica o status Mogado nos outros jogadores, reduzindo aleatoriamente um status por 12 horas.",
    price: 30,
    type: "consumable",
    rarity: "common",
    effect_code: "MOGADO_DEBUFF",
    icon: "Wand2",
    min_level: 1,
    stackable: true,
    metadata: {
      activation: "active",
      duration_hours: 12,
      debuffOptions: [
        { targetStat: "stat_foco", amount: 4, label: "Foco" },
        { targetStat: "stat_networking", amount: 4, label: "Networking" },
      ],
    },
  };
}

test.beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
});

test("Mogado aplica debuff nos outros perfis e registra uso no historico", () => {
  const mogadoItem = makeMogadoItem();
  const caster = makeProfile("caster", {
    inventory: [{ item_id: mogadoItem.id, qty: 1 }],
  });
  const targetA = makeProfile("target-a");
  const targetB = makeProfile("target-b");

  globalThis.localStorage.setItem(
    LOCAL_DB_KEY,
    JSON.stringify({
      profiles: [caster, targetA, targetB],
      shopItems: [mogadoItem],
      logs: [],
    }),
  );

  const updatedCaster = localApi.useItem(caster.id, mogadoItem.id);
  const profiles = localApi.getProfiles();
  const updatedTargetA = profiles.find((profile) => profile.id === targetA.id);
  const updatedTargetB = profiles.find((profile) => profile.id === targetB.id);
  const logs = localApi.getLogs();

  assert.ok(updatedTargetA, "target A not found");
  assert.ok(updatedTargetB, "target B not found");
  assert.equal(updatedCaster.inventory.length, 0);
  assert.equal(
    updatedTargetA.active_buffs.some((buff) => buff.type === "MOGADO"),
    true,
  );
  assert.equal(
    updatedTargetB.active_buffs.some((buff) => buff.type === "MOGADO"),
    true,
  );
  assert.match(logs[0]?.message ?? "", /aplicou Mogado em 2 jogador\(es\)/);
});

test("api.useItem preserva a mensagem real de erro do backend", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: "MOGADO update failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    await assert.rejects(
      api.useItem("caster", "shop-mogado-badge"),
      /Internal Server Error - MOGADO update failed/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Briga rouba um item aleatorio do inventario de outra pessoa", () => {
  const stealItem: ShopItem = {
    id: "shop-briga",
    name: "Briga",
    description:
      "Rouba um item aleatorio do inventario de outra pessoa imediatamente.",
    price: 170,
    type: "rare",
    rarity: "epic",
    effect_code: "STEAL_INVENTORY_ITEM",
    icon: "Swords",
    min_level: 2,
    stackable: true,
    metadata: { activation: "active" },
  };
  const rewardItem: ShopItem = {
    id: "shop-coin-lite",
    name: "Imã de Moedas Lite",
    description:
      "Aumenta modestamente seus ganhos de SetorCoins por 30 minutos.",
    price: 95,
    type: "passive",
    rarity: "rare",
    effect_code: "COIN_MAGNET",
    icon: "Coins",
    min_level: 1,
    stackable: false,
    metadata: { activation: "active", multiplier: 1.2 },
  };
  const caster = makeProfile("caster", {
    inventory: [{ item_id: stealItem.id, qty: 1 }],
  });
  const target = makeProfile("target", {
    inventory: [{ item_id: rewardItem.id, qty: 1 }],
  });

  globalThis.localStorage.setItem(
    LOCAL_DB_KEY,
    JSON.stringify({
      profiles: [caster, target],
      shopItems: [stealItem, rewardItem],
      logs: [],
    }),
  );

  const updatedCaster = localApi.useItem(caster.id, stealItem.id);
  const profiles = localApi.getProfiles();
  const updatedTarget = profiles.find((profile) => profile.id === target.id);

  assert.ok(updatedTarget, "target not found");
  assert.equal(
    updatedCaster.inventory.some((entry) => entry.item_id === rewardItem.id),
    true,
  );
  assert.equal(updatedTarget.inventory.length, 0);
  assert.match(
    localApi.getLogs()[0]?.message ?? "",
    /roubou Imã de Moedas Lite de Profile target/,
  );
});
