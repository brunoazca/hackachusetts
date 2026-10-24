// Piper design tokens for JS consumers (MapLibre paint, Recharts, motion).
// Spec: docs/design/README.md (source of truth: docs/design/tokens/tokens.json). Keep in sync with web/src/styles/piper.css.

export type ThemeName = "night" | "bone";

export const palette = {
  soot: "#111315",
  velvet: "#181B1E",
  walnut: "#1F2327",
  walnut2: "#282D32",
  seam: "#2F353B",
  edge: "#68717A",
  inkWater: "#0D1A26",
  bone: "#F2F3F1",
  bone2: "#FAFAF9",
  bone3: "#FFFFFF",
  ash: "#AEB5BC",
  mink: "#8A929A",
  brass: "#F2F3F1",
  vermilion: "#FF5A4E",
  delft: "#6FA0FF",
  verdigris: "#3DBE7A",
  oxblood: "#7A1E2C",
} as const;

/** Semantic UI colors per theme. Mirrors docs/design/tokens/tokens.json (checked by scripts/check-design-tokens.py). */
export const semantic = {
  night: {
    bg: "#111315", panelSolid: "#181B1E", card: "#1F2327", cardHover: "#282D32",
    line: "#2F353B", edge: "#68717A", fg: "#F2F3F1", fg2: "#AEB5BC", fg3: "#8A929A",
    accent: "#F2F3F1", accentFg: "#111315", accentHover: "#FFFFFF", accentPress: "#C9CED3",
    return: "#FF5A4E", forecast: "#6FA0FF", held: "#3DBE7A", seal: "#7A1E2C",
    danger: "#FF7A6B", water: "#0D1A26",
  },
  bone: {
    bg: "#F2F3F1", panelSolid: "#FAFAF9", card: "#FFFFFF", cardHover: "#EEEFEC",
    line: "#DCDDD9", edge: "#82878D", fg: "#111315", fg2: "#4A4F55", fg3: "#646A71",
    accent: "#111315", accentFg: "#F2F3F1", accentHover: "#2A2E33", accentPress: "#3A3F45",
    return: "#C8241A", forecast: "#003DA5", held: "#00733A", seal: "#7A1E2C",
    danger: "#B3261E", water: "#C9DDF0",
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
    fg2: "#4A4F55",
    fg3: "#646A71",
    line: "#DCDDD9",
    accent: "#111315",
    open: palette.soot,
    closed: palette.mink,
    returned: "#C8241A",
    forecast: "#003DA5",
    held: "#00733A",
    driver: "#4A4F55",
    selected: "#111315",
    water: "#C9DDF0",
  },
};

/** Basemap recolor targets (applied to OpenFreeMap "dark" on style.load). */
export const basemap: Record<ThemeName, Record<string, string>> = {
  night: {
    background: "#111315",
    water: "#0D1A26",
    park: "#13120F",
    building: "#181B1E",
    buildingOutline: "#1F2327",
    roadMinor: "#1C1916",
    roadMajor: "#282D32",
    rail: "#241F1B",
    boundary: "#2F353B",
    labelPlace: "#8A929A",
    labelStreet: "#68717A",
    labelHalo: "#111315",
  },
  bone: {
    background: "#F2F3F1",
    water: "#C9DDF0",
    park: "#E4DFD3",
    building: "#E2DACD",
    buildingOutline: "#DCDDD9",
    roadMinor: "#DDD4C6",
    roadMajor: "#D2C8B8",
    rail: "#CFC5B5",
    boundary: "#C9BFAF",
    labelPlace: "#646A71",
    labelStreet: "#857A6E",
    labelHalo: "#F2F3F1",
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

export const MAX_RINGS = 3;

/** Ring i (1..MAX_RINGS) around a chronic site. */
export const ring = (i: number) => ({
  radius: 6 + 6 * i,
  width: 1,
  opacity: 1 - 0.25 * i,
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
