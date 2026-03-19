import {
  Profile,
  ShopItem,
  ShopPullResult,
  BattleLog,
  MageInsights,
  SocialRankingEntry,
  SocialTitlesResponse,
  ProcessDrawResponse,
  RoadmapItem,
} from "../types";

const API_BASE = "/api";

export const api = {
  getAccessStatus: async (): Promise<{
    enabled: boolean;
    authenticated: boolean;
  }> => {
    const res = await fetch(`${API_BASE}/access/status`);
    if (!res.ok) throw new Error("Failed to fetch access status");
    return res.json();
  },
  unlockAccess: async (
    password: string,
  ): Promise<{
    success: boolean;
    authenticated: boolean;
    enabled: boolean;
  }> => {
    const res = await fetch(`${API_BASE}/access/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error("Invalid access password");
    return res.json();
  },
  logoutAccess: async (): Promise<void> => {
    const res = await fetch(`${API_BASE}/access/logout`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to logout access");
  },

  // Profiles
  getProfiles: async (): Promise<Profile[]> => {
    const res = await fetch(`${API_BASE}/profiles`);
    if (!res.ok) throw new Error("Failed to fetch profiles");
    return res.json();
  },
  createProfile: async (profile: Partial<Profile>): Promise<Profile> => {
    const res = await fetch(`${API_BASE}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error("Failed to create profile");
    return res.json();
  },
  updateProfile: async (
    id: string,
    updates: Partial<Profile>,
  ): Promise<Profile> => {
    const res = await fetch(`${API_BASE}/profiles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },
  deleteProfile: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/profiles/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete profile");
  },

  // Shop
  getShopItems: async (): Promise<ShopItem[]> => {
    const res = await fetch(`${API_BASE}/shop`);
    if (!res.ok) throw new Error("Failed to fetch shop items");
    return res.json();
  },
  pullShopItems: async (
    profileId: string,
    count: 1 | 10,
  ): Promise<ShopPullResult> => {
    const res = await fetch(`${API_BASE}/shop/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, count }),
    });
    if (!res.ok) throw new Error("Failed to pull shop items");
    return res.json();
  },
  buyItem: async (profileId: string, itemId: string): Promise<Profile> => {
    const res = await fetch(`${API_BASE}/shop/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, itemId }),
    });
    if (!res.ok) throw new Error("Failed to buy item");
    return res.json();
  },
  useItem: async (profileId: string, itemId: string): Promise<Profile> => {
    const res = await fetch(`${API_BASE}/inventory/use`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, itemId }),
    });
    if (!res.ok) throw new Error("Failed to use item");
    return res.json();
  },

  // Logs
  getLogs: async (): Promise<BattleLog[]> => {
    const res = await fetch(`${API_BASE}/logs`);
    if (!res.ok) throw new Error("Failed to fetch logs");
    return res.json();
  },
  getMageInsights: async (profileId: string): Promise<MageInsights> => {
    const res = await fetch(
      `${API_BASE}/mage/insights?profileId=${encodeURIComponent(profileId)}`,
    );
    if (!res.ok) throw new Error("Failed to fetch mage insights");
    return res.json();
  },
  getRanking: async (): Promise<SocialRankingEntry[]> => {
    const res = await fetch(`${API_BASE}/social/ranking`);
    if (!res.ok) throw new Error("Failed to fetch ranking");
    return res.json();
  },
  getTitles: async (): Promise<SocialTitlesResponse> => {
    const res = await fetch(`${API_BASE}/social/titles`);
    if (!res.ok) throw new Error("Failed to fetch titles");
    return res.json();
  },

  // Process Draw
  processDraw: async (
    category: string,
    winnerIds: string[],
    participants: string[],
  ): Promise<ProcessDrawResponse> => {
    const res = await fetch(`${API_BASE}/draw/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, winnerIds, participants }),
    });
    if (!res.ok) throw new Error("Failed to process draw");
    return res.json();
  },

  // Roadmap
  getRoadmap: async (): Promise<RoadmapItem[]> => {
    const res = await fetch(`${API_BASE}/roadmap`);
    if (!res.ok) throw new Error("Failed to fetch roadmap");
    return res.json();
  },
  addRoadmapItem: async (
    title: string,
    description: string,
    created_by: string,
  ): Promise<RoadmapItem[]> => {
    const res = await fetch(`${API_BASE}/roadmap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, created_by }),
    });
    if (!res.ok) throw new Error("Failed to add roadmap item");
    return res.json();
  },
  voteRoadmapItem: async (id: string): Promise<RoadmapItem[]> => {
    const res = await fetch(`${API_BASE}/roadmap/${id}/vote`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to vote for roadmap item");
    return res.json();
  },
  updateRoadmapItemStatus: async (
    id: string,
    status: string,
  ): Promise<RoadmapItem[]> => {
    const res = await fetch(`${API_BASE}/roadmap/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update roadmap item");
    return res.json();
  },

  // Stats
  allocateStat: async (
    profileId: string,
    stat:
      | "stat_foco"
      | "stat_resiliencia"
      | "stat_networking"
      | "stat_malandragem",
  ): Promise<Profile> => {
    const res = await fetch(`${API_BASE}/profiles/${profileId}/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stat }),
    });
    if (!res.ok) throw new Error("Failed to allocate stat");
    return res.json();
  },
};
