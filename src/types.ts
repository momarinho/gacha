import type { DailyChallengeId } from "../shared/dailyChallenges";

export type ProfileClass =
  | "novato"
  | "aprendiz_guerreiro"
  | "aprendiz_mago"
  | "aprendiz_ladino"
  | "aprendiz_clerigo"
  | "guerreiro"
  | "mago"
  | "ladino"
  | "clerigo";

export interface InventoryItem {
  item_id: string;
  qty: number;
}

export interface ActiveBuff {
  type: string;
  expiresAt: string;
  value?: number;
  metadata?: Record<string, any>;
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

export interface Profile {
  id: string;
  name: string;
  class: ProfileClass;
  level: number;
  xp: number;
  coins: number;
  hp: number;
  max_hp: number;
  luck: number;
  titles: string[];
  passive_coin_multiplier: number;
  temporary_coin_multiplier: number;
  exhaustion_threshold: number;
  exhaustion_penalty_multiplier: number;
  inventory: InventoryItem[];
  active_buffs: ActiveBuff[];
  daily_challenge_state?: DailyChallengeState | null;
  last_weekday_recovery_at?: string | null;
  participates_in_pao: boolean;
  participates_in_agua: boolean;
  participates_in_balde: boolean;
  participates_in_geral: boolean;
  stat_points: number;
  stat_foco: number;
  stat_resiliencia: number;
  stat_networking: number;
  stat_malandragem: number;
  created_at?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "consumable" | "passive" | "rare";
  rarity?: "common" | "rare" | "epic" | "legendary";
  effect_code: string;
  icon: string;
  min_level: number;
  duration_minutes?: number | null;
  metadata?: Record<string, any>;
  stackable?: boolean;
  target_category?: "pao" | "agua" | "balde" | "geral" | null;
  created_at?: string;
}

export type ShopBanner = "standard" | "catastrophe";

export interface ShopPullDrop {
  item: ShopItem;
  rarity: "common" | "rare" | "epic" | "legendary";
  isGuaranteed: boolean;
}

export interface ShopPullResult {
  profile: Profile;
  banner: ShopBanner;
  spentCoins: number;
  totalPulls: number;
  pityToRare: number;
  pityToLegendary: number;
  drops: ShopPullDrop[];
}

export interface BattleLog {
  id: string;
  created_at: string;
  event_type: string;
  category: string;
  message: string;
  primary_actor_id: string;
  metadata: any;
  profiles?: {
    name: string;
    class: string;
  };
}

export interface MageInsightQueue {
  key: "pao" | "agua" | "balde" | "geral";
  label: string;
  excludedIds: string[];
  excludedNames: string[];
}

export interface MageInsights {
  profileId: string;
  profileName: string;
  queues: MageInsightQueue[];
  recentLogs: BattleLog[];
}

export interface SocialRankingEntry {
  id: string;
  name: string;
  class: ProfileClass;
  level: number;
  xp: number;
  coins: number;
  titles: string[];
}

export interface SocialTitlesResponse {
  titlesByProfileId: Record<string, string[]>;
}

export interface RewardBreakdownItem {
  label: string;
  value: number;
}

export interface DrawRewardSummary {
  profileId: string;
  profileName: string;
  category: "pao" | "agua" | "balde" | "geral" | "solo";
  isWinner: boolean;
  xpGain: number;
  coinGain: number;
  xpBreakdown: RewardBreakdownItem[];
  coinBreakdown: RewardBreakdownItem[];
}

export interface ProcessDrawResponse {
  success: boolean;
  updates: Profile[];
  winnerIds: string[];
  rewards: DrawRewardSummary[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "done";
  created_by: string | null;
  votes: number;
  created_at: string;
  profiles?: {
    name: string;
    class: string;
  };
}
