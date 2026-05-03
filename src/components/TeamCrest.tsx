import { initials } from "@/types/match";

type Shape = "circle" | "shield" | "hex" | "rounded" | "diamond";
type ColorKey = "white" | "green" | "gold" | "red";

interface ColorDef {
  bg: string;
  fg: string;
  ring: string;
}

const COLORS: Record<ColorKey, ColorDef> = {
  white: { bg: "#ffffff", fg: "#0a0a0a", ring: "rgba(0,0,0,0.15)" },
  green: { bg: "hsl(var(--primary))", fg: "hsl(var(--primary-foreground))", ring: "rgba(0,0,0,0.25)" },
  gold: { bg: "#f5c518", fg: "#1a1a1a", ring: "rgba(0,0,0,0.2)" },
  red: { bg: "#dc2626", fg: "#ffffff", ring: "rgba(0,0,0,0.25)" },
};

const SHAPES: Shape[] = ["circle", "shield", "hex", "rounded", "diamond"];
const COLOR_KEYS: ColorKey[] = ["white", "green", "gold", "red"];

// All (shape, color) combos in deterministic order
const COMBOS: Array<{ shape: Shape; color: ColorKey }> = SHAPES.flatMap((s) =>
  COLOR_KEYS.map((c) => ({ shape: s, color: c }))
);

const hash = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const pickCombo = (name: string, exclude?: { shape: Shape; color: ColorKey }) => {
  const start = hash(name) % COMBOS.length;
  for (let i = 0; i < COMBOS.length; i++) {
    const c = COMBOS[(start + i) % COMBOS.length];
    if (!exclude || c.shape !== exclude.shape || c.color !== exclude.color) return c;
  }
  return COMBOS[start];
};

const shapeStyle = (shape: Shape): React.CSSProperties => {
  switch (shape) {
    case "shield":
      return { clipPath: "polygon(0 0, 100% 0, 100% 62%, 50% 100%, 0 62%)", borderRadius: 4 };
    case "hex":
      return { clipPath: "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%)" };
    case "rounded":
      return { borderRadius: 6 };
    case "diamond":
      return { transform: "rotate(45deg)", borderRadius: 4 };
    case "circle":
    default:
      return { borderRadius: "9999px" };
  }
};

interface Props {
  name: string;
  combo?: { shape: Shape; color: ColorKey };
  size?: number;
}

export const TeamCrest = ({ name, combo, size = 36 }: Props) => {
  const c = combo ?? pickCombo(name);
  const colors = COLORS[c.color];
  const inner = c.shape === "diamond";
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: colors.bg,
        boxShadow: `inset 0 0 0 1.5px ${colors.ring}`,
        ...shapeStyle(c.shape),
      }}
      aria-label={name}
    >
      <span
        className="font-display font-extrabold leading-none"
        style={{
          color: colors.fg,
          fontSize: size * 0.36,
          transform: inner ? "rotate(-45deg)" : undefined,
          letterSpacing: "-0.02em",
        }}
      >
        {initials(name)}
      </span>
    </div>
  );
};
