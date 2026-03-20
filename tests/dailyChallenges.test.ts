import test from "node:test";
import assert from "node:assert/strict";

import {
  applyDailyChallengeEvent,
  getDailyChallengeForDate,
  normalizeDailyChallengeState,
} from "../shared/dailyChallenges.js";

function findDateKeyForChallenge(challengeId: string) {
  for (let day = 1; day <= 31; day++) {
    const dateKey = `2026-03-${String(day).padStart(2, "0")}`;
    if (getDailyChallengeForDate(dateKey).id === challengeId) {
      return dateKey;
    }
  }
  throw new Error(`date key for ${challengeId} not found`);
}

test("desafio diario de participacao conclui com uma acao e recompensa uma vez", () => {
  const dateKey = findDateKeyForChallenge("official_participation");
  const initial = normalizeDailyChallengeState(null, dateKey);

  const first = applyDailyChallengeEvent(
    initial,
    dateKey,
    { type: "official_participation" },
    new Date("2026-03-19T12:00:00-03:00"),
  );

  assert.equal(first.state.completed, true);
  assert.equal(first.newlyCompleted, true);
  assert.equal(first.state.progress, first.state.goal);

  const second = applyDailyChallengeEvent(
    first.state,
    dateKey,
    { type: "official_participation" },
    new Date("2026-03-19T13:00:00-03:00"),
  );

  assert.equal(second.state.completed, true);
  assert.equal(second.newlyCompleted, false);
});

test("desafio diario de moedas acumula progresso incremental", () => {
  const dateKey = findDateKeyForChallenge("earn_20_coins");
  const initial = normalizeDailyChallengeState(null, dateKey);

  const first = applyDailyChallengeEvent(
    initial,
    dateKey,
    { type: "earn_20_coins", value: 8 },
    new Date("2026-03-19T12:00:00-03:00"),
  );
  const second = applyDailyChallengeEvent(
    first.state,
    dateKey,
    { type: "earn_20_coins", value: 12 },
    new Date("2026-03-19T13:00:00-03:00"),
  );

  assert.equal(first.state.completed, false);
  assert.equal(first.state.progress, 8);
  assert.equal(second.state.completed, true);
  assert.equal(second.state.progress, 20);
});
