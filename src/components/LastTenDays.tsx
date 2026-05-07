import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, isSameDay } from "date-fns";
import type { Match } from "@/types/match";

interface Props {
  matches: Match[];
  activeDate?: Date;
}

export const LastTenDays = ({ matches, activeDate = new Date() }: Props) => {
  const navigate = useNavigate();
  const days = Array.from({ length: 10 }).map((_, i) => subDays(new Date(), 9 - i));
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "end", block: "nearest" });
  }, [activeDate]);

  const statsFor = (d: Date) => {
    const dayMatches = matches.filter((m) => isSameDay(new Date(m.match_date), d));
    const wins = dayMatches.filter((m) => m.result === "win").length;
    const losses = dayMatches.filter((m) => m.result === "loss").length;
    return { wins, losses, hasData: dayMatches.length > 0 };
  };

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 min-w-max pb-2 sm:min-w-0 sm:w-full">
        {days.map((d) => {
          const { wins, losses, hasData } = statsFor(d);
          const active = isSameDay(d, activeDate);
          return (
            <button
              key={d.toISOString()}
              ref={active ? activeRef : undefined}
              onClick={() => navigate(`/date/${format(d, "yyyy-MM-dd")}`)}
              className={`shrink-0 w-14 sm:flex-1 sm:w-auto sm:min-w-0 rounded-lg border p-1.5 text-center transition-all hover:-translate-y-0.5 ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.6)]"
                  : "card-elevated border-border/60 hover:border-primary/40"
              }`}
            >
              <div className={`text-[9px] font-bold tracking-widest uppercase ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {format(d, "EEE")}
              </div>
              <div className="font-display font-bold text-base mt-0.5 leading-none">{format(d, "d")}</div>
              {hasData ? (
                <div className={`text-[10px] font-semibold mt-0.5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  <span className={active ? "" : "text-primary"}>{wins}</span>
                  <span className="opacity-60">/</span>
                  <span className={active ? "" : "text-destructive"}>{losses}</span>
                </div>
              ) : (
                <div className="text-[10px] mt-0.5 opacity-40">—</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
