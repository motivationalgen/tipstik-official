export type Sport = "football" | "basketball" | "tennis" | "other";
export type MatchResult = "pending" | "win" | "loss" | "draw";
export type MatchTier = "free" | "members" | "pro" | "vip";

export interface Match {
  id: string;
  team_a: string;
  team_b: string;
  league: string;
  sport: Sport;
  match_time: string;
  match_date: string;
  prediction_label: string;
  prediction_text: string;
  odds: number;
  confidence: number | null;
  result: MatchResult;
  tier: MatchTier;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
