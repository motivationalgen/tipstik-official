import { Clock, ArrowUpRight, TrendingUp, Check, X, Minus, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { type Match } from "@/types/match";
import { useAuth } from "@/hooks/useAuth";
import { canView, tierBadgeClass, tierLabel } from "@/lib/tier";
import { TeamCrest, pickCombo } from "@/components/TeamCrest";

interface Props {
  match: Match;
  onView?: (m: Match) => void;
}

const resultBadge = (r: Match["result"]) => {
  if (r === "win") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold"><Check className="h-3 w-3" />WIN</span>;
  if (r === "loss") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold"><X className="h-3 w-3" />LOSS</span>;
  if (r === "draw") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold"><Minus className="h-3 w-3" />DRAW</span>;
  return null;
};

export const MatchCard = ({ match, onView }: Props) => {
  const { tier } = useAuth();
  const matchTier = match.tier ?? "members";
  const unlocked = canView(matchTier, tier);
  const comboA = pickCombo(match.team_a);
  const comboB = pickCombo(match.team_b, comboA);

  return (
    <div className="card-elevated rounded-2xl border border-border/60 p-3 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5 group">
      {/* Top row */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase truncate">
          {match.league}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${tierBadgeClass(matchTier)}`}>
            {tierLabel(matchTier)}
          </span>
          {match.result !== "pending" && resultBadge(match.result)}
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-around mb-1.5">
        <div className="flex flex-col items-center gap-1">
          <TeamCrest name={match.team_a} combo={comboA} />
          <span className="text-[11px] font-medium text-center max-w-[80px] truncate">{match.team_a}</span>
        </div>
        <div className="font-display font-bold text-muted-foreground text-xs">VS</div>
        <div className="flex flex-col items-center gap-1">
          <TeamCrest name={match.team_b} combo={comboB} />
          <span className="text-[11px] font-medium text-center max-w-[80px] truncate">{match.team_b}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mb-2">
        <Clock className="h-3 w-3" />
        <span>{match.match_time}</span>
      </div>

      {/* Prediction */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/50 border border-border/40 mb-2 relative overflow-hidden">
        <div className={`min-w-0 ${unlocked ? "" : "blur-sm select-none pointer-events-none"}`}>
          <div className="text-[10px] font-bold tracking-widest text-primary mb-0.5">{match.prediction_label}</div>
          <div className="text-xs font-medium truncate">{match.prediction_text}</div>
        </div>
        <div className={`flex items-center gap-1 shrink-0 ${unlocked ? "" : "blur-sm select-none pointer-events-none"}`}>
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
          <span className="font-display font-bold text-primary text-base">{Number(match.odds).toFixed(2)}</span>
        </div>
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {unlocked ? (
        <Button
          asChild
          size="sm"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-8 text-xs"
        >
          <Link to={`/match/${match.id}`} onClick={() => onView?.(match)}>
            <TrendingUp className="h-3.5 w-3.5" />
            View Prediction
          </Link>
        </Button>
      ) : (
        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-full font-semibold h-8 text-xs border-primary/40 text-primary hover:bg-primary/10"
        >
          <Link to="/pricing">
            <Lock className="h-3.5 w-3.5" />
            Unlock — Upgrade
          </Link>
        </Button>
      )}
    </div>
  );
};
