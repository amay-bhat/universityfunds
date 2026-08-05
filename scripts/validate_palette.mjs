// Palette validator — restored 2026-08-05.
//
// The original `scripts/validate_palette.js` is referenced by
// `src/app/globals.css:28-29` as the tool that certified this palette, and by
// the task 3.2 completion note. It no longer exists in the repo, which left that
// certification claim unverifiable. This restores the capability.
//
// It is a REIMPLEMENTATION, not the original. It reproduces the original's two
// documented outputs — the count of low-contrast light-mode slots requiring
// "relief", and an adjacent-pair distinguishability check on stack order — and
// adds colour-vision-deficiency simulation. Where it disagrees with the original,
// assume the original is unavailable rather than that this one is wrong; the
// numbers below are computed from the CSS, so they can be re-derived by hand.
//
//   npm run verify:palette
//
// Exits non-zero on an unaccepted failure.

import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf8");

// Token blocks: `.viz-root` at globals.css:31-47 holds the light values, and the
// `@media (prefers-color-scheme: dark) { .viz-root { … } }` block at :48-66 holds
// the dark overrides. Parse each block by its own brace span — an earlier version
// of this file sliced from the first "prefers-color-scheme" match and silently
// read LIGHT values into the dark set, reporting dark --viz-axis as #c3c2b7 on
// #fcfcfb. That produced four plausible-looking failures, two of them fictional.
function blockAfter(marker, from = 0) {
  const i = css.indexOf(marker, from);
  if (i === -1) throw new Error(`marker not found: ${marker}`);
  const open = css.indexOf("{", i);
  let depth = 0;
  for (let j = open; j < css.length; j++) {
    if (css[j] === "{") depth++;
    else if (css[j] === "}") {
      depth--;
      if (depth === 0) return { text: css.slice(open, j), end: j };
    }
  }
  throw new Error(`unbalanced braces after ${marker}`);
}
function parse(text) {
  const out = {};
  for (const m of text.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[m[1]] = m[2].toLowerCase();
  }
  return out;
}

const lightBlock = blockAfter(".viz-root");
const light = parse(lightBlock.text);
// The dark .viz-root lives inside the media query that follows the light block.
const darkMedia = blockAfter("@media (prefers-color-scheme: dark)", lightBlock.end);
const dark = { ...light, ...parse(darkMedia.text) };

for (const [name, t] of [["light", light], ["dark", dark]]) {
  for (const k of ["--viz-surface", "--viz-muted", "--viz-axis", "--series-1"]) {
    if (!t[k]) throw new Error(`${name} token block missing ${k} — CSS shape changed`);
  }
}
if (light["--viz-surface"] === dark["--viz-surface"]) {
  throw new Error(
    "light and dark resolved to the same surface — the dark block was not parsed",
  );
}

const srgb = (h) => {
  h = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const linz = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = (h) => {
  const [r, g, b] = srgb(h).map(linz);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

// Brettel-style CVD approximation in linear RGB. Good enough to answer "are
// these two hues still separable", which is the only question asked of it.
const CVD = {
  deuteranopia: [
    [0.625, 0.375, 0.0],
    [0.7, 0.3, 0.0],
    [0.0, 0.3, 0.7],
  ],
  protanopia: [
    [0.567, 0.433, 0.0],
    [0.558, 0.442, 0.0],
    [0.0, 0.242, 0.758],
  ],
  tritanopia: [
    [0.95, 0.05, 0.0],
    [0.0, 0.433, 0.567],
    [0.0, 0.475, 0.525],
  ],
};
function simulate(hex, kind) {
  const [r, g, b] = srgb(hex).map(linz);
  const m = CVD[kind];
  const out = [
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  ];
  const enc = (c) => {
    c = Math.min(1, Math.max(0, c));
    const v = c <= 0.00304 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(v * 255);
  };
  return "#" + out.map(enc).map((v) => v.toString(16).padStart(2, "0")).join("");
}
// Perceptual-ish separation in CIELAB. ΔE < 12 reads as "these could be confused".
function deltaE(h1, h2) {
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const lab = (h) => {
    const [r, g, b] = srgb(h).map(linz);
    const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
    const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
    const [fx, fy, fz] = [f(X), f(Y), f(Z)];
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  };
  const [a, b2] = [lab(h1), lab(h2)];
  return Math.hypot(a[0] - b2[0], a[1] - b2[1], a[2] - b2[2]);
}

// Documented, accepted failures. The three low-contrast light-mode series slots
// are the original validator's own finding: it did not require them to pass, it
// required "relief", and the relief is the mandatory table-view twin under every
// chart (see .claude/skills/dataviz/SKILL.md). Listing them here preserves that
// contract instead of silently lowering the bar.
const ACCEPTED_LOW_CONTRAST_SLOTS = new Set(["--series-3", "--series-4", "--series-5"]);

let failures = 0;
const note = (ok, msg) => {
  console.log(`${ok ? "PASS  " : "FAIL  "}${msg}`);
  if (!ok) failures++;
};

console.log("=== text roles, WCAG 1.4.3 (4.5:1 normal text) ===");
for (const [theme, t] of [["light", light], ["dark", dark]]) {
  const surface = t["--viz-surface"];
  for (const role of ["--viz-text", "--viz-text-2", "--viz-muted"]) {
    const r = contrast(t[role], surface);
    note(
      r >= 4.5,
      `${theme} ${role} ${t[role]} on ${surface} = ${r.toFixed(2)}:1`,
    );
  }
}

console.log("\n=== non-text contrast, WCAG 1.4.11 (3:1 for meaningful graphics) ===");
for (const [theme, t] of [["light", light], ["dark", dark]]) {
  const surface = t["--viz-surface"];
  const r = contrast(t["--viz-axis"], surface);
  note(
    r >= 3,
    `${theme} --viz-axis ${t["--viz-axis"]} = ${r.toFixed(2)}:1 — draws reference lines that carry meaning (coverage end, basis boundaries)`,
  );
}
console.log(
  "  note: --viz-grid is exempt as purely decorative (1.4.11 covers graphics required to understand content)",
);

console.log("\n=== series slots vs light surface (3:1) ===");
let lowSlots = [];
for (let i = 1; i <= 8; i++) {
  const key = `--series-${i}`;
  const r = contrast(light[key], light["--viz-surface"]);
  if (r < 3) {
    lowSlots.push(key);
    const accepted = ACCEPTED_LOW_CONTRAST_SLOTS.has(key);
    console.log(
      `${accepted ? "ACCEPT" : "FAIL  "}  ${key} ${light[key]} = ${r.toFixed(2)}:1 — requires table-twin relief`,
    );
    if (!accepted) failures++;
  } else {
    note(true, `${key} ${light[key]} = ${r.toFixed(2)}:1`);
  }
}
note(
  lowSlots.length === 3,
  `exactly 3 low-contrast light-mode slots, matching the original validator's finding (found ${lowSlots.length}: ${lowSlots.join(", ")})`,
);

console.log("\n=== adjacent stack pairs must stay separable (stack order = slot order) ===");
for (const [theme, t] of [["light", light], ["dark", dark]]) {
  for (let i = 1; i < 8; i++) {
    const [a, b] = [t[`--series-${i}`], t[`--series-${i + 1}`]];
    const d = deltaE(a, b);
    note(d >= 12, `${theme} slot ${i}|${i + 1} ${a}/${b} ΔE=${d.toFixed(1)}`);
  }
}

console.log("\n=== colour-vision deficiency: adjacent pairs under simulation ===");
for (const kind of Object.keys(CVD)) {
  for (let i = 1; i < 8; i++) {
    const a = simulate(light[`--series-${i}`], kind);
    const b = simulate(light[`--series-${i + 1}`], kind);
    const d = deltaE(a, b);
    note(d >= 10, `${kind} slot ${i}|${i + 1} ΔE=${d.toFixed(1)}`);
  }
}

console.log(
  `\n${failures === 0 ? "palette validated" : `${failures} failure(s)`}`,
);
if (failures > 0) {
  console.error(
    "Meaning-bearing colours below threshold must either be darkened or given a " +
      "non-colour redundancy. Do not add a new hue while this is failing.",
  );
  process.exit(1);
}
