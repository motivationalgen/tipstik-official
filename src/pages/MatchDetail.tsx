import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Calendar, Clock, Lock, Check, X, Minus, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { canView, tierBadgeClass, tierLabel } from "@/lib/tier";
import { TeamCrest, pickCombo } from "@/components/TeamCrest";
import { Button } from "@/components/ui/button";
import type { Match } from "@/types/match";

const resultBadge = (r: Match["result"]) => {
  if (r === "win") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold"><Check className="h-3.5 w-3.5" />WIN</span>;
  if (r === "loss") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-xs font-bold"><X className="h-3.5 w-3.5" />LOSS</span>;
  if (r === "draw") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-bold"><Minus className="h-3.5 w-3.5" />DRAW</span>;
  return null;
};

const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tier } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("matches").select("*").eq("id", id).maybeSingle();
      setMatch((data as Match) ?? null);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (match) document.title = `${match.team_a} vs ${match.team_b} — Tipstik`;
  }, [match]);

  if (loading) return <div className="container py-16 text-center text-muted-foreground">Loading...</div>;
  if (!match) return <div className="container py-16 text-center text-muted-foreground">Match not found.</div>;

  const matchTier = match.tier ?? "members";
  const unlocked = canView(matchTier, tier);
  const comboA = pickCombo(match.team_a);
  const comboB = pickCombo(match.team_b, comboA);

  return (
    <div className="container max-w-2xl py-6 space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="card-elevated rounded-2xl border border-border/60 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase truncate">
            {match.league}
          </span>
          {match.result !== "pending" ? resultBadge(match.result) : (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider ${tierBadgeClass(matchTier)}`}>
              {tierLabel(matchTier)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-around">
          <div className="flex flex-col items-center gap-2">
            <TeamCrest name={match.team_a} combo={comboA} size={64} />
            <span className="text-sm font-semibold text-center max-w-[120px]">{match.team_a}</span>
          </div>
          <div className="font-display font-bold text-muted-foreground">VS</div>
          <div className="flex flex-col items-center gap-2">
            <TeamCrest name={match.team_b} combo={comboB} size={64} />
            <span className="text-sm font-semibold text-center max-w-[120px]">{match.team_b}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{match.match_date}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{match.match_time}</span>
        </div>

        {unlocked ? (
          <>
            <div className="rounded-xl bg-secondary/60 border border-border/50 p-4 space-y-2">
              <div className="text-[11px] font-bold tracking-widest text-primary">{match.prediction_label}</div>
              <div className="text-base font-medium">{match.prediction_text}</div>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Odds</span>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                  <span className="font-display font-bold text-primary text-2xl">{Number(match.odds).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {match.confidence != null && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground uppercase tracking-wider font-semibold">Confidence</span>
                  <span className="font-bold text-primary">{match.confidence}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, match.confidence))}%` }} />
                </div>
              </div>
            )}

            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              <TrendingUp className="h-4 w-4" />
              Track this prediction
            </Button>
          </>
        ) : (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center space-y-3">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/15">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-display font-bold text-lg">This prediction is locked</div>
              <div className="text-sm text-muted-foreground">Upgrade your plan to view {tierLabel(matchTier)} tips.</div>
            </div>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              <Link to="/pricing">Unlock — Upgrade</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetail;
