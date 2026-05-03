import { Check, X, Minus } from "lucide-react";
import type { Match } from "@/types/match";

interface Props { matches: Match[]; }

const Item = ({ m }: { m: Match }) => {
  const winner = m.result === "win" ? `${m.team_a} WIN` : m.result === "loss" ? `${m.team_b} WIN` : m.result === "draw" ? "DRAW" : "—";
  const Icon = m.result === "win" ? Check : m.result === "loss" ? X : Minus;
  const colorClass = m.result === "win" ? "text-primary" : m.result === "loss" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="shrink-0 w-[40vw] max-w-[260px] mx-1.5 card-elevated rounded-xl border border-border/60 px-2.5 py-2">
      <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-0.5 truncate">{m.league}</div>
      <div className="text-xs font-medium truncate">{m.team_a} <span className="text-muted-foreground">vs</span> {m.team_b}</div>
      <div className={`mt-1 inline-flex items-center gap-1 text-[11px] font-bold ${colorClass}`}>
        <Icon className="h-3 w-3" />
        {winner}
      </div>
    </div>
  );
};

export const YesterdayCarousel = ({ matches }: Props) => {
  if (matches.length === 0) {
    return (
      <div className="card-elevated rounded-2xl border border-border/60 p-6 text-center">
        <p className="text-muted-foreground text-sm">No results available for yesterday.</p>
      </div>
    );
  }
  const loop = [...matches, ...matches];
  return (
    <div className="overflow-hidden -mx-4 px-4 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div className="flex animate-marquee" style={{ width: "max-content" }}>
        {loop.map((m, i) => <Item key={`${m.id}-${i}`} m={m} />)}
      </div>
    </div>
  );
};
