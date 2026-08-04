# WP6 — Regenerate the structure snapshot, last

3 work orders. Part of the [31 July 2026 audit](README.md) — read section 0 there first.

**Why this package exists**

`STRUCTURE.md` is a snapshot of the file tree. This audit adds `conduct/audits/` (and WP1 adds `conduct/rulings/`), so regenerating before the other packages land produces a snapshot that is stale on arrival. The regeneration recipe is in `STRUCTURE.md:189-225`.

---

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-35` | medium | `STRUCTURE.md` | 123 | STRUCTURE.md calls all 5 public/ SVGs unreferenced; two are referenced by src/app/page.tsx |
| `A-36` | medium | `STRUCTURE.md` | 152 | STRUCTURE.md "Three groupings" App row is 19; actual is 20, and the rows do not sum to the s… |
| `A-37` | medium | `STRUCTURE.txt` | 183 | STRUCTURE.txt and STRUCTURE.pdf corrupt the tsconfig glob: **/*.ts rendered as /*.ts** |

---

### A-35 · STRUCTURE.md calls all 5 public/ SVGs unreferenced; two are referenced by src/app/page.tsx

| | |
|---|---|
| **Severity** | medium |
| **Location** | `STRUCTURE.md:123` |
| **Found by** | 2 independent auditors — `completeness-critic`, `docs-vs-reality` |
| **Status** | **Synthesis pass** — filed by the completeness / cross-dimension auditors, which run last and are not themselves refuted |

**Current text at `HEAD` = `00a08ec`**

```text
122: ├── public/                          file · globe · next · vercel · window .svg
123: │                                      (5 scaffold SVGs, unreferenced — known debt)
124: │
```

**What is wrong**

The tree annotates public/ as '(5 scaffold SVGs, unreferenced — known debt)'. Two of the five, next.svg and vercel.svg, are referenced by the scaffold starter page. Only file.svg, globe.svg and window.svg are unreferenced.

**Also reported at this site**

- _docs-vs-reality_ (medium) — STRUCTURE.md calls all 5 public/ SVGs unreferenced; two are referenced by src/app/page.tsx

**Fix**

Reword to '(5 scaffold SVGs — 3 unreferenced; next.svg and vercel.svg are used by the starter page and go when task 2.1 replaces it)'.

**Verify**

```bash
sed -n "120,126p" STRUCTURE.md
```

---

### A-36 · STRUCTURE.md "Three groupings" App row is 19; actual is 20, and the rows do not sum to the stated 73

| | |
|---|---|
| **Severity** | medium |
| **Location** | `STRUCTURE.md:152` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
151: | **Data layer** | `data/` + `scripts/` | 13 | The figures, and the validator guarding them |
152: | **App** | `src/` + `public/` + config | 19 | Next.js app — 2 routes so far; Phases 2–6 build the rest |
153:
```

**What is wrong**

The Three groupings table gives Framework 30, Data layer 13, App (src/ + public/ + config) 19. Recounting: src/ = 7 files, public/ = 5, config = 8 (package.json, package-lock.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs, drizzle.config.ts, .gitignore) = 20. With App at 19 the table plus the 10 un-grouped root documents sums to 72, one short of the 73 the same file states three sections earlier; with App at 20 it reconciles exactly.

**Fix**

Change the App row to 20. Optionally add the 13 root documents as a fourth row so the table visibly sums to the tracked-file count and future drift is self-detecting.

**Verify**

```bash
sed -n "149,155p" STRUCTURE.md
```

---

### A-37 · STRUCTURE.txt and STRUCTURE.pdf corrupt the tsconfig glob: **/*.ts rendered as /*.ts**

| | |
|---|---|
| **Severity** | medium |
| **Location** | `STRUCTURE.txt:183` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
182:   it would silently shadow the entire src/app/ tree.
183: - tsconfig.json includes /*.ts**, so a type error anywhere -- including in
184:   scripts/ or a future test file -- fails the Vercel deploy, not just the local build.
```

**What is wrong**

The ASCII rendering mangles the glob in the structural-notes section: STRUCTURE.md's '`tsconfig.json` includes `**/*.ts`' becomes 'tsconfig.json includes /*.ts**' — the markdown-emphasis stripper consumed the leading ** of the glob and moved it to the end. The same glob survives intact in the tree block at STRUCTURE.txt:129, so only one of the two occurrences is corrupt. Commit 00a08ec is titled 'Fix self-referential mangling in STRUCTURE conversion', so this class of bug was supposedly closed; this instance survived it. Because the clipping check reports 0, the corrupted line is also present in STRUCTURE.pdf.

**Fix**

In the converter, protect inline-code spans before stripping ** emphasis (the tree block already gets this right), then re-run the cupsfilter recipe at STRUCTURE.md:212-215 to regenerate STRUCTURE.pdf. Verify with the same grep that both occurrences read '**/*.ts'.

**Verify**

```bash
sed -n "180,186p" STRUCTURE.txt
```

---
