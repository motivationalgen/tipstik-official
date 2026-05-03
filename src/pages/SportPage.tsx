import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard } from "@/components/MatchCard";
import type { Match, Sport } from "@/types/match";

interface Props { sport: Sport; title: string; emoji: string; }

export const SportPage = ({ sport, title, emoji }: Props) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${title} Tips — Tipstik`;
    supabase.from("matches").select("*").eq("sport", sport).order("match_date", { ascending: false }).limit(50)
      .then(({ data }) => { setMatches((data ?? []) as Match[]); setLoading(false); });
  }, [sport, title]);

  return (
    <div className="container py-8 space-y-6">
      <header className="space-y-2 animate-fade-up">
        <div className="inline-flex items-center gap-2">
          <span className="text-3xl">{emoji}</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">{title} <span className="text-gradient-primary">Tips</span></h1>
        </div>
        <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE d MMMM").toUpperCase()}</p>
      </header>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-72 rounded-2xl bg-card animate-pulse border border-border/60" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="card-elevated rounded-2xl border border-border/60 p-8 text-center text-muted-foreground text-sm">
          No {title.toLowerCase()} tips available right now.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  );
};
