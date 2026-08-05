# Corrections

This file is the public record of every figure this project got wrong and fixed.

It exists because the site's entire claim on a reader's trust is that the numbers
are right and every one carries a citation. A project making that claim needs a
visible place where it admits errors. **A corrections log is an asset, not an
admission** — its absence is what should worry a reader, since a site with no
corrections after years of hand-transcribing hundreds of figures is either
extraordinarily lucky or not looking.

**Nothing has been logged yet.** That is a statement about the site's age, not
about its accuracy.

---

## What counts as a correction

Log it here if a **published figure or a factual claim about the data was wrong**
and a reader could have been misled:

- a curated number that does not match its cited source (transcription error);
- a figure attributed to the wrong fiscal year, school or category;
- a measurement-basis claim that was untrue — e.g. describing years as labelled a
  certain way when nothing labelled them, or presenting two bases as one
  continuous series;
- a coverage claim that overstated what the data contains.

**Do not log here:** layout and styling fixes, wording improvements that were not
false, accessibility repairs, or internal refactors. Those belong in the
`TASKS.md` build log. Keeping this file to substantive factual errors is what
makes it worth reading.

## Procedure

1. **Verify against the source document before changing anything.** Re-read the
   cited page. The reporter may be wrong, or the disagreement may be a
   measurement-basis difference rather than an error — that distinction is the
   most common source of apparent contradictions in this data.
2. **Fix the seed file, never the database** (Article 8). Edit
   `data/schools/<school>.json` or `data/sources.json`.
3. **Run the gates in order:** `npm run seed:dry`, `npm run seed:verify`,
   `npm run verify:figures`, then `npm run seed`.
4. **Ask whether the same error class exists elsewhere.** Nearly every defect
   found in this project so far had siblings — a false claim in one blurb had a
   twin on the methodology page; one chart's caption bug applied to every school.
   Grep for the pattern, not just the instance.
5. **Add an entry below**, then log it in `TASKS.md` too.
6. If the wrong figure was displayed for a meaningful period, say so in the entry.
   Readers deserve to know whether they may have seen it.

## Entry format

```
### YYYY-MM-DD — <one-line description>
- **What was wrong:** the figure or claim as published.
- **What is correct, and the source:** with the citation.
- **Cause:** transcription, misattribution, basis confusion, stale prose.
- **How long it was live:** dates, or "never displayed" if caught pre-launch.
- **Sibling check:** where else this class was looked for, and what was found.
- **Commit:** the fixing commit hash.
```

---

## How to report an error

**This is currently an open gap.** The site has no contact address, no issue
link and no reporting form, so a reader who spots a wrong number has no route to
tell anyone. Closing it is a one-line change to the site footer and is the
highest-leverage fix outstanding from the 2026-08-05 legal review
(`conduct/audits/tier1-legal-review.md`), which also notes that a contact route
de-escalates several other findings at the same time.

Until then, corrections can only originate from the maintainer's own checks —
which is precisely the weakness a corrections process is supposed to remove.

---

## Log

*No corrections recorded yet.*
