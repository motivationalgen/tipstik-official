import { Trophy, Target, TrendingUp } from "lucide-react";

interface Props {
  tipsToday: number;
  winRate: number;
  totalWins: number;
}

export const StatsCards = ({ tipsToday, winRate, totalWins }: Props) => {
  const items = [
    { label: "Tips Today", value: tipsToday, icon: Target },
    { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp },
    { label: "Wins", value: totalWins, icon: Trophy },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((s, i) => (
        <div
          key={s.label}
          className="card-elevated rounded-xl border border-border/60 p-3 animate-fade-up"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
            <s.icon className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-medium tracking-wide uppercase truncate">{s.label}</span>
          </div>
          <div className="font-display font-bold text-xl sm:text-2xl text-gradient-primary">{s.value}</div>
        </div>
      ))}
    </div>
  );
};
