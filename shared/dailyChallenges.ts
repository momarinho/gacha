export type DailyChallengeId =
  | "official_participation"
  | "solo_completion"
  | "earn_20_coins"
  | "survive_risky_draw";

export type DailyChallengeEvent =
  | { type: "official_participation"; value?: number }
  | { type: "solo_completion"; value?: number }
  | { type: "earn_20_coins"; value: number }
  | { type: "survive_risky_draw"; value?: number };

export interface DailyChallengeDefinition {
  id: DailyChallengeId;
  title: string;
  description: string;
  goal: number;
  rewardXp: number;
  rewardCoins: number;
}

export interface DailyChallengeState {
  dateKey: string;
  challengeId: DailyChallengeId;
  title: string;
  description: string;
  progress: number;
  goal: number;
  rewardXp: number;
  rewardCoins: number;
  completed: boolean;
  completedAt?: string | null;
}

const DAILY_CHALLENGES: DailyChallengeDefinition[] = [
  {
    id: "official_participation",
    title: "Bater O Ponto",
    description: "Participe de 1 sorteio oficial hoje.",
    goal: 1,
    rewardXp: 10,
    rewardCoins: 4,
  },
  {
    id: "solo_completion",
    title: "Missão Solo",
    description: "Complete 1 sorteio Solo hoje.",
    goal: 1,
    rewardXp: 12,
    rewardCoins: 4,
  },
  {
    id: "earn_20_coins",
    title: "Meta De Caixa",
    description: "Ganhe 20 SetorCoins em sorteios oficiais hoje.",
    goal: 20,
    rewardXp: 12,
    rewardCoins: 5,
  },
  {
    id: "survive_risky_draw",
    title: "Saiu Vivo",
    description: "Sobreviva a 1 sorteio de Água, Balde ou Pão hoje.",
    goal: 1,
    rewardXp: 11,
    rewardCoins: 4,
  },
];

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getBusinessDateKey(
  now = new Date(),
  timezone = "America/Sao_Paulo",
) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getDailyChallengeForDate(dateKey: string) {
  return DAILY_CHALLENGES[hashString(dateKey) % DAILY_CHALLENGES.length];
}

export function normalizeDailyChallengeState(
  current: unknown,
  dateKey: string,
): DailyChallengeState {
  const challenge = getDailyChallengeForDate(dateKey);
  const existing =
    current && typeof current === "object"
      ? (current as Partial<DailyChallengeState>)
      : null;

  if (
    existing &&
    existing.dateKey === dateKey &&
    existing.challengeId === challenge.id
  ) {
    return {
      dateKey,
      challengeId: challenge.id,
      title: challenge.title,
      description: challenge.description,
      progress: Math.max(0, Number(existing.progress || 0)),
      goal: challenge.goal,
      rewardXp: challenge.rewardXp,
      rewardCoins: challenge.rewardCoins,
      completed: Boolean(existing.completed),
      completedAt:
        typeof existing.completedAt === "string" ? existing.completedAt : null,
    };
  }

  return {
    dateKey,
    challengeId: challenge.id,
    title: challenge.title,
    description: challenge.description,
    progress: 0,
    goal: challenge.goal,
    rewardXp: challenge.rewardXp,
    rewardCoins: challenge.rewardCoins,
    completed: false,
    completedAt: null,
  };
}

export function applyDailyChallengeEvent(
  current: unknown,
  dateKey: string,
  event: DailyChallengeEvent,
  now = new Date(),
) {
  const state = normalizeDailyChallengeState(current, dateKey);
  if (state.completed || state.challengeId !== event.type) {
    return { state, newlyCompleted: false };
  }

  const delta = Math.max(0, Number(event.value ?? 1));
  const nextProgress = Math.min(state.goal, state.progress + delta);
  const completed = nextProgress >= state.goal;

  return {
    state: {
      ...state,
      progress: nextProgress,
      completed,
      completedAt: completed ? now.toISOString() : state.completedAt ?? null,
    },
    newlyCompleted: completed && !state.completed,
  };
}
