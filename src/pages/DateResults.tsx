import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard } from "@/components/MatchCard";
import type { Match } from "@/types/match";

const DateResults = () => {
  const { date } = useParams<{ date: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!date) return;
    document.title = `Results ${date} — Tipstik`;
    supabase.from("matches").select("*").eq("match_date", date).order("match_time")
      .then(({ data }) => { setMatches((data ?? []) as Match[]); setLoading(false); });
  }, [date]);

  const wins = matches.filter((m) => m.result === "win").length;
  const losses = matches.filter((m) => m.result === "loss").length;

  return (
    <div className="container py-8 space-y-6">
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <header className="space-y-2 animate-fade-up">
        <h1 className="font-display font-bold text-3xl sm:text-4xl">
          {date ? format(new Date(date), "EEEE d MMMM").toUpperCase() : ""}
        </h1>
        <div className="text-sm text-muted-foreground">
          <span className="text-primary font-bold">{wins}W</span> · <span className="text-destructive font-bold">{losses}L</span> · {matches.length} tips
        </div>
      </header>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-72 rounded-2xl bg-card animate-pulse border border-border/60" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="card-elevated rounded-2xl border border-border/60 p-8 text-center text-muted-foreground text-sm">No tips for this day.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  );
};

export default DateResults;
