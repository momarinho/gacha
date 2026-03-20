import {
  Profile,
  ShopBanner,
  ShopItem,
  ShopPullResult,
  BattleLog,
  MageInsights,
  SocialRankingEntry,
  SocialTitlesResponse,
  ProcessDrawResponse,
  RoadmapItem,
} from "../types";
import { localApi } from "./localApi";

const API_BASE = "/api";
let useLocalFallback = false;

function shouldFallback(status: number) {
  // Only persistently switch to local mode when backend explicitly says
  // the feature is not implemented for the active provider.
  return status === 501;
}

async function readApiErrorMessage(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    const details =
      payload?.details && typeof payload.details === "string"
        ? ` - ${payload.details}`
        : "";
    const hint =
      payload?.hint && typeof payload.hint === "string"
        ? ` (${payload.hint})`
        : "";
    const errorText =
      payload?.error && typeof payload.error === "string"
        ? payload.error
        : fallback;
    return `${errorText}${details}${hint}`;
  } catch {
    return fallback;
  }
}

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
    if (useLocalFallback) return localApi.getProfiles();
    const res = await fetch(`${API_BASE}/profiles`);
    if (shouldFallback(res.status)) {
      useLocalFallback = true;
      return localApi.getProfiles();
    }
    if (!res.ok) throw new Error("Failed to fetch profiles");
    return res.json();
  },
  createProfile: async (profile: Partial<Profile>): Promise<Profile> => {
    if (useLocalFallback) return localApi.createProfile(profile);
    try {
      const res = await fetch(`${API_BASE}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (shouldFallback(res.status)) {
        useLocalFallback = true;
        return localApi.createProfile(profile);
      }
      if (!res.ok) throw new Error("Failed to create profile");
      return res.json();
    } catch {
      useLocalFallback = true;
      return localApi.createProfile(profile);
    }
  },
  updateProfile: async (
    id: string,
    updates: Partial<Profile>,
  ): Promise<Profile> => {
    if (useLocalFallback) return localApi.updateProfile(id, updates);
    try {
      const res = await fetch(`${API_BASE}/profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (shouldFallback(res.status)) {
        useLocalFallback = true;
        return localApi.updateProfile(id, updates);
      }
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    } catch {
      useLocalFallback = true;
      return localApi.updateProfile(id, updates);
    }
  },
  deleteProfile: async (id: string): Promise<void> => {
    if (useLocalFallback) return localApi.deleteProfile(id);
    try {
      const res = await fetch(`${API_BASE}/profiles/${id}`, { method: "DELETE" });
      if (shouldFallback(res.status)) {
        useLocalFallback = true;
        return localApi.deleteProfile(id);
      }
      if (!res.ok) throw new Error("Failed to delete profile");
    } catch {
      useLocalFallback = true;
      return localApi.deleteProfile(id);
    }
  },

  // Shop
  getShopItems: async (): Promise<ShopItem[]> => {
    if (useLocalFallback) return localApi.getShopItems();
    const res = await fetch(`${API_BASE}/shop`);
    if (shouldFallback(res.status)) {
      useLocalFallback = true;
      return localApi.getShopItems();
    }
    if (!res.ok) throw new Error("Failed to fetch shop items");
    return res.json();
  },
  pullShopItems: async (
    profileId: string,
    count: 1 | 10,
    banner: ShopBanner,
  ): Promise<ShopPullResult> => {
    if (useLocalFallback) return localApi.pullShopItems(profileId, count, banner);
    try {
      const res = await fetch(`${API_BASE}/shop/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, count, banner }),
      });
      if (shouldFallback(res.status)) {
        useLocalFallback = true;
        return localApi.pullShopItems(profileId, count, banner);
      }
      if (!res.ok) throw new Error("Failed to pull shop items");
      return res.json();
    } catch {
      useLocalFallback = true;
      return localApi.pullShopItems(profileId, count, banner);
    }
  },
  buyItem: async (profileId: string, itemId: string): Promise<Profile> => {
    if (useLocalFallback) return localApi.buyItem(profileId, itemId);
    try {
      const res = await fetch(`${API_BASE}/shop/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, itemId }),
      });
      if (shouldFallback(res.status)) {
        useLocalFallback = true;
        return localApi.buyItem(profileId, itemId);
      }
      if (!res.ok) throw new Error("Failed to buy item");
      return res.json();
    } catch {
      useLocalFallback = true;
      return localApi.buyItem(profileId, itemId);
    }
  },
  useItem: async (profileId: string, itemId: string): Promise<Profile> => {
    if (useLocalFallback) return localApi.useItem(profileId, itemId);
    try {
      const res = await fetch(`${API_BASE}/inventory/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, itemId }),
      });
      if (shouldFallback(res.status)) {
        useLocalFallback = true;
        return localApi.useItem(profileId, itemId);
      }
      if (!res.ok) throw new Error("Failed to use item");
      return res.json();
    } catch {
      useLocalFallback = true;
      return localApi.useItem(profileId, itemId);
    }
  },

  // Logs
  getLogs: async (): Promise<BattleLog[]> => {
    if (useLocalFallback) return localApi.getLogs();
    const res = await fetch(`${API_BASE}/logs`);
    if (shouldFallback(res.status)) {
      useLocalFallback = true;
      return localApi.getLogs();
    }
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
    if (useLocalFallback) return localApi.getTitles();
    const res = await fetch(`${API_BASE}/social/titles`);
    if (shouldFallback(res.status)) {
      useLocalFallback = true;
      return localApi.getTitles();
    }
    if (!res.ok) throw new Error("Failed to fetch titles");
    return res.json();
  },

  // Process Draw
  processDraw: async (
    category: string,
    winnerIds: string[],
    participants: string[],
  ): Promise<ProcessDrawResponse> => {
    if (useLocalFallback)
      return localApi.processDraw(category, winnerIds, participants);
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/draw/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, winnerIds, participants }),
      });
    } catch {
      throw new Error("Failed to reach draw processing endpoint");
    }

    if (shouldFallback(res.status)) {
      useLocalFallback = true;
      return localApi.processDraw(category, winnerIds, participants);
    }

    if (!res.ok) {
      const message = await readApiErrorMessage(res, "Failed to process draw");
      throw new Error(message);
    }

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
    status: RoadmapItem["status"],
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
    if (useLocalFallback) return localApi.allocateStat(profileId, stat);
    try {
      const res = await fetch(`${API_BASE}/profiles/${profileId}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stat }),
      });
      if (shouldFallback(res.status)) {
        useLocalFallback = true;
        return localApi.allocateStat(profileId, stat);
      }
      if (!res.ok) throw new Error("Failed to allocate stat");
      return res.json();
    } catch {
      useLocalFallback = true;
      return localApi.allocateStat(profileId, stat);
    }
  },
};
