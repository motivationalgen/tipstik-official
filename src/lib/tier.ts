import type { MatchTier } from "@/types/match";

export type UserTier = "guest" | "member" | "pro" | "vip" | "admin";

const TIER_RANK: Record<MatchTier, number> = {
  free: 0,
  members: 1,
  pro: 2,
  vip: 3,
};

const USER_RANK: Record<UserTier, number> = {
  guest: -1,
  member: 1,
  pro: 2,
  vip: 3,
  admin: 3,
};

export const canView = (matchTier: MatchTier, userTier: UserTier) =>
  USER_RANK[userTier] >= TIER_RANK[matchTier];

export const tierBadgeClass = (tier: MatchTier) => {
  switch (tier) {
    case "free":
      return "bg-muted text-muted-foreground";
    case "members":
      return "bg-primary text-primary-foreground";
    case "pro":
      return "bg-amber-500 text-black";
    case "vip":
      return "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white";
  }
};

export const tierLabel = (tier: MatchTier) => tier.toUpperCase();
