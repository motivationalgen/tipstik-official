import { useEffect, useMemo, useState } from "react";
import { format, isToday, isYesterday, subDays } from "date-fns";
import { CalendarDays, Flame, ChevronRight, Target, TrendingUp, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatsCards } from "@/components/StatsCards";
import { LastTenDays } from "@/components/LastTenDays";
import { YesterdayCarousel } from "@/components/YesterdayCarousel";
import { MatchCard } from "@/components/MatchCard";
import { toast } from "sonner";
import type { Match } from "@/types/match";

type OddsFilter = "all" | "2+" | "3+" | "5+";

const Index = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [oddsFilter, setOddsFilter] = useState<OddsFilter>("all");

  useEffect(() => {
    document.title = "Tipstik — Today's Tips & Sport Predictions";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "Expert sport predictions with reasoning. Updated daily — football, basketball, tennis tips.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description"; m.content = desc; document.head.appendChild(m);
    }

    const since = format(subDays(new Date(), 10), "yyyy-MM-dd");
    supabase.from("matches").select("*").gte("match_date", since).order("match_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setMatches((data ?? []) as Match[]);
        setLoading(false);
      });
  }, []);

  const todays = matches.filter((m) => isToday(new Date(m.match_date)));
  const yesterdays = matches.filter((m) => isYesterday(new Date(m.match_date)) && m.result !== "pending");
  const completed = matches.filter((m) => m.result !== "pending");
  const wins = completed.filter((m) => m.result === "win").length;
  const winRate = completed.length ? Math.round((wins / completed.length) * 100) : 0;
  const football = todays.filter((m) => m.sport === "football");

  return (
    <div className="container py-6 sm:py-10 space-y-10">
      {/* HERO */}
      <section className="text-center space-y-3 animate-fade-up">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-muted-foreground uppercase">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          {format(new Date(), "EEEE d MMMM").toUpperCase()}
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-6xl tracking-tight">
          TODAY'S <span className="text-gradient-primary">TIPS</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
          Expert sport predictions with reasoning. Updated daily.
        </p>
      </section>

      {/* STATS */}
      <StatsCards tipsToday={todays.length} winRate={winRate} totalWins={wins} />

      {/* LAST 10 DAYS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Last 10 Days</h2>
        </div>
        <LastTenDays matches={matches} />
      </section>

      {/* YESTERDAY RESULTS */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-bold text-lg">Yesterday's Results</h2>
        </div>
        <YesterdayCarousel matches={yesterdays} />
      </section>

      {/* ALL GAMES TODAY */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold text-lg">All Games — Today</h2>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-card animate-pulse border border-border/60" />
            ))}
          </div>
        ) : todays.length === 0 ? (
          <div className="card-elevated rounded-2xl border border-border/60 p-8 text-center text-muted-foreground text-sm">
            No tips for today yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todays.map((m) => (
              <MatchCard key={m.id} match={m} onView={(x) => toast(`${x.team_a} vs ${x.team_b}`, { description: x.prediction_text })} />
            ))}
          </div>
        )}
      </section>

      {/* FOOTBALL */}
      {football.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚽</span>
              <h2 className="font-display font-bold text-lg">Football</h2>
            </div>
            <a href="/football" className="text-sm text-primary inline-flex items-center hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {football.map((m) => (
              <MatchCard key={m.id} match={m} onView={(x) => toast(`${x.team_a} vs ${x.team_b}`, { description: x.prediction_text })} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
