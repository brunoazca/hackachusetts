// Piper design tokens for JS consumers (MapLibre paint, Recharts, motion).
// Spec: docs/design/README.md (source of truth: docs/design/tokens/tokens.json). Keep in sync with web/src/styles/piper.css.

export type ThemeName = "night" | "bone";

export const palette = {
  soot: "#0F0D0C",
  velvet: "#171412",
  walnut: "#211D1A",
  walnut2: "#2A2521",
  seam: "#302A25",
  edge: "#6A5F55",
  inkWater: "#121416",
  bone: "#EDE6DA",
  bone2: "#F5F0E6",
  bone3: "#FBF8F2",
  ash: "#B5ACA0",
  mink: "#968878",
  brass: "#C9A55C",
  vermilion: "#F0643C",
  delft: "#8FAEE0",
  verdigris: "#6FA594",
  oxblood: "#7A1E2C",
} as const;

/** Semantic UI colors per theme. Mirrors docs/design/tokens/tokens.json (checked by scripts/check-design-tokens.py). */
export const semantic = {
  night: {
    bg: "#0F0D0C", panelSolid: "#171412", card: "#211D1A", cardHover: "#2A2521",
    line: "#302A25", edge: "#6A5F55", fg: "#EDE6DA", fg2: "#B5ACA0", fg3: "#968878",
    accent: "#C9A55C", accentFg: "#0F0D0C", accentHover: "#D8B872", accentPress: "#B08E47",
    return: "#F0643C", forecast: "#8FAEE0", held: "#6FA594", seal: "#7A1E2C",
    danger: "#FF7A6B", water: "#121416",
  },
  bone: {
    bg: "#EDE6DA", panelSolid: "#F5F0E6", card: "#FBF8F2", cardHover: "#F1EADF",
    line: "#D8CFC1", edge: "#857868", fg: "#0F0D0C", fg2: "#4F463E", fg3: "#6B6056",
    accent: "#7E5A1A", accentFg: "#EDE6DA", accentHover: "#6B4C15", accentPress: "#5A3F11",
    return: "#A8381A", forecast: "#2C4F8C", held: "#2F6B5A", seal: "#7A1E2C",
    danger: "#B3261E", water: "#DCD8CF",
  },
} as const;

export interface DataColors {
  bg: string;
  fg: string;
  fg2: string;
  fg3: string;
  line: string;
  accent: string;
  open: string;
  closed: string;
  returned: string;
  forecast: string;
  held: string;
  driver: string;
  selected: string;
  water: string;
}

export const themes: Record<ThemeName, DataColors> = {
  night: {
    bg: palette.soot,
    fg: palette.bone,
    fg2: palette.ash,
    fg3: palette.mink,
    line: palette.seam,
    accent: palette.brass,
    open: palette.bone,
    closed: palette.mink,
    returned: palette.vermilion,
    forecast: palette.delft,
    held: palette.verdigris,
    driver: palette.ash,
    selected: palette.brass,
    water: palette.inkWater,
  },
  bone: {
    bg: palette.bone,
    fg: palette.soot,
    fg2: "#4F463E",
    fg3: "#6B6056",
    line: "#D8CFC1",
    accent: "#7E5A1A",
    open: palette.soot,
    closed: palette.mink,
    returned: "#A8381A",
    forecast: "#2C4F8C",
    held: "#2F6B5A",
    driver: "#4F463E",
    selected: "#7E5A1A",
    water: "#DCD8CF",
  },
};

/** Basemap recolor targets (applied to OpenFreeMap "dark" on style.load). */
export const basemap: Record<ThemeName, Record<string, string>> = {
  night: {
    background: "#0F0D0C",
    water: "#121416",
    park: "#13120F",
    building: "#171412",
    buildingOutline: "#211D1A",
    roadMinor: "#1C1916",
    roadMajor: "#2A2521",
    rail: "#241F1B",
    boundary: "#302A25",
    labelPlace: "#968878",
    labelStreet: "#6A5F55",
    labelHalo: "#0F0D0C",
  },
  bone: {
    background: "#EDE6DA",
    water: "#DCD8CF",
    park: "#E4DFD3",
    building: "#E2DACD",
    buildingOutline: "#D8CFC1",
    roadMinor: "#DDD4C6",
    roadMajor: "#D2C8B8",
    rail: "#CFC5B5",
    boundary: "#C9BFAF",
    labelPlace: "#6B6056",
    labelStreet: "#857A6E",
    labelHalo: "#EDE6DA",
  },
};

export const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

/** Map padding so flyTo/fitBounds targets land in the clear area (desktop ≥ 1024). */
export const mapPadding = { top: 80, left: 288, right: 424, bottom: 136 } as const;
export const mapPaddingCollapsedRail = { top: 80, left: 80, right: 424, bottom: 136 } as const;

export const motion = {
  instant: 80,
  fast: 140,
  base: 220,
  slow: 320,
  slower: 480,
  story: 900,
  stagger: 40,
  staggerRings: 80,
  ringDraw: 600,
  tuneTraverse: 2400,
  tuneAutoStop: 8000,
  timelineWeek: 400,
  flyCurve: 1.42,
  ease: {
    out: [0.16, 1, 0.3, 1],
    spring: [0.22, 1, 0.36, 1],
    inOut: [0.65, 0, 0.35, 1],
    in: [0.4, 0, 1, 1],
    stamp: [0.34, 1.56, 0.64, 1],
  },
} as const;

export const MAX_RINGS = 5;

/** Ring i (1..MAX_RINGS) around a chronic site. */
export const ring = (i: number) => ({
  radius: 8 + 7 * i,
  width: 1.25,
  opacity: 1 - 0.17 * i,
});

/** Heatmap ramp (warm only, night). */
export const heatmapColor = [
  "interpolate", ["linear"], ["heatmap-density"],
  0, "rgba(15,13,12,0)",
  0.2, "rgba(139,125,112,0.35)",
  0.5, "rgba(201,165,92,0.6)",
  0.8, "rgba(240,100,60,0.8)",
  1, "rgba(240,100,60,0.95)",
] as const;

export const reportRadius = [
  "interpolate", ["linear"], ["zoom"], 13, 2.5, 16, 5, 18, 7,
] as const;

export const clusterRadius = [
  "step", ["get", "point_count"], 12, 25, 16, 100, 22, 500, 28,
] as const;

/** Forecast band fill opacity (over a delft hatch pattern). */
export const forecastBandOpacity = { low: 0.25, mid: 0.5, high: 0.85 } as const;

/** Recharts defaults. */
export const chart = (t: ThemeName) => {
  const c = themes[t];
  return {
    axis: { stroke: "none", tick: { fill: c.fg3, fontSize: 11, fontFamily: "var(--font-mono)" } },
    grid: { stroke: c.line, strokeDasharray: "2 4", vertical: false },
    baseline: c.fg3,
    highlight: c.returned,
    forecast: { stroke: c.forecast, strokeDasharray: "4 3" },
    held: c.held,
    barRadius: [2, 2, 0, 0] as [number, number, number, number],
  };
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.motion === "reduced");
