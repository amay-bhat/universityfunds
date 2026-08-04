import type { SchoolId } from "./constants";

// Per-school identity accents: each school's OFFICIAL color plus a monogram.
// Deliberately NOT the universities' logos/seals — those are trademarked, and
// this site shouldn't republish protected marks. A color + initial badge reads
// as identity without impersonating official material.
//
// These colors are page DECORATION ONLY (badges, accent borders, hairlines).
// Charts keep the validated dataviz palette — three of these are near-identical
// dark reds, which would fail every CVD gate as series colors.
//
// `fg` is the badge text color chosen for contrast on the school color:
// white clears 4.5:1 on all four dark grounds; Princeton's orange needs black.
export const SCHOOL_THEME: Record<
  SchoolId,
  { color: string; fg: string; monogram: string; colorName: string }
> = {
  yale: { color: "#00356B", fg: "#FFFFFF", monogram: "Y", colorName: "Yale Blue" },
  harvard: { color: "#A51C30", fg: "#FFFFFF", monogram: "H", colorName: "Harvard Crimson" },
  stanford: { color: "#8C1515", fg: "#FFFFFF", monogram: "S", colorName: "Cardinal Red" },
  mit: { color: "#750014", fg: "#FFFFFF", monogram: "M", colorName: "MIT Cardinal" },
  princeton: { color: "#E77500", fg: "#111111", monogram: "P", colorName: "Princeton Orange" },
};

// One accent hue per feature area, used for page kickers, card icons and
// hover states so each section of the site has its own temperature.
// Text shades are the -700/800 steps (≥4.5:1 on white); decorative borders
// may use lighter steps.
export const FEATURE_ACCENT = {
  explore: { text: "text-sky-700 dark:text-sky-400", border: "hover:border-sky-400 dark:hover:border-sky-600", chip: "bg-sky-600" },
  translate: { text: "text-amber-700 dark:text-amber-400", border: "hover:border-amber-400 dark:hover:border-amber-600", chip: "bg-amber-600" },
  compare: { text: "text-emerald-700 dark:text-emerald-400", border: "hover:border-emerald-400 dark:hover:border-emerald-600", chip: "bg-emerald-600" },
  methodology: { text: "text-violet-700 dark:text-violet-400", border: "hover:border-violet-400 dark:hover:border-violet-600", chip: "bg-violet-600" },
} as const;

// The five school colors as one hairline gradient — the site's quiet
// signature, used on the header and footer rules.
export const SCHOOL_GRADIENT =
  "linear-gradient(to right, #00356B, #A51C30, #8C1515, #750014, #E77500)";
