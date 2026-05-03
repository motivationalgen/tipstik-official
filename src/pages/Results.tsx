import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard } from "@/components/MatchCard";
import type { Match } from "@/types/match";

const Results = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Results Archive — Tipstik";
    supabase.from("matches").select("*").neq("result", "pending").order("match_date", { ascending: false }).limit(100)
      .then(({ data }) => { setMatches((data ?? []) as Match[]); setLoading(false); });
  }, []);

  const grouped = matches.reduce<Record<string, Match[]>>((acc, m) => {
    (acc[m.match_date] ||= []).push(m); return acc;
  }, {});

  return (
    <div className="container py-8 space-y-8">
      <header className="space-y-2 animate-fade-up">
        <h1 className="font-display font-bold text-3xl sm:text-4xl">Results <span className="text-gradient-primary">Archive</span></h1>
        <p className="text-muted-foreground text-sm">Full track record of completed predictions.</p>
      </header>
      {loading ? (
        <div className="space-y-6">{[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-card animate-pulse border border-border/60" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card-elevated rounded-2xl border border-border/60 p-8 text-center text-muted-foreground text-sm">No completed results yet.</div>
      ) : (
        Object.entries(grouped).map(([date, list]) => {
          const wins = list.filter((m) => m.result === "win").length;
          const losses = list.filter((m) => m.result === "loss").length;
          return (
            <section key={date} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg">{format(new Date(date), "EEEE d MMMM yyyy")}</h2>
                <div className="text-xs font-bold">
                  <span className="text-primary">{wins}W</span> <span className="text-muted-foreground">·</span> <span className="text-destructive">{losses}L</span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
};

export default Results;
