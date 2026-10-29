import { Star, Radio } from "lucide-react";
import { SPORTS, TOP_LEAGUES, type Match, type SportId } from "@/lib/sample-data";

export function SportsSidebar({
  matches,
  sport,
  onSport,
  liveOnly,
}: {
  matches: Match[];
  sport: SportId | "all";
  onSport: (s: SportId | "all") => void;
  liveOnly: boolean;
}) {
  const pool = liveOnly ? matches.filter((m) => m.live) : matches;
  const count = (id: SportId) => pool.filter((m) => m.sportId === id).length;

  return (
    <aside className="space-y-3">
      <div className="overflow-hidden rounded-md bg-card shadow-card">
        <div className="flex items-center gap-2 bg-panel-head px-3 py-2 text-xs font-bold uppercase tracking-wide text-secondary-foreground">
          {liveOnly ? <Radio className="h-3.5 w-3.5 text-live" /> : null}
          {liveOnly ? "Live sports" : "Sports"}
        </div>
        <ul className="py-1">
          <li>
            <SidebarItem
              active={sport === "all"}
              onClick={() => onSport("all")}
              icon="🏆"
              label="All sports"
              count={pool.length}
            />
          </li>
          {SPORTS.map((s) => (
            <li key={s.id}>
              <SidebarItem
                active={sport === s.id}
                onClick={() => onSport(s.id)}
                icon={s.icon}
                label={s.name}
                count={count(s.id)}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-md bg-card shadow-card">
        <div className="flex items-center gap-2 bg-panel-head px-3 py-2 text-xs font-bold uppercase tracking-wide text-secondary-foreground">
          <Star className="h-3.5 w-3.5 text-gold" /> Top championships
        </div>
        <ul className="py-1">
          {TOP_LEAGUES.map((l) => (
            <li
              key={l.name}
              className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-foreground"
            >
              <span>{l.flag}</span>
              {l.name}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function SidebarItem({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 border-l-[3px] px-3 py-2 text-left text-[13px] transition-colors ${
        active
          ? "border-cta bg-accent font-semibold text-accent-foreground"
          : "border-transparent text-foreground hover:bg-muted"
      }`}
    >
      <span className="w-5 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="rounded bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
        {count}
      </span>
    </button>
  );
}
