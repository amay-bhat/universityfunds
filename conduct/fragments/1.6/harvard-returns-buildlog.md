### Task 1.6.D — Harvard returns tail (FY2000-FY2006, FY2010)

**Landed:** all 8 target years, closing Harvard's returns/market-value series to a
full FY2000-FY2025 (26 years), with zero touched outside the assigned range.

- FY2000: 32.2%, $19,148.3M
- FY2001: -2.7%, $18,259.2M
- FY2002: -0.5%, $17,518.0M
- FY2003: 12.5%, $19,294.7M
- FY2004: 21.1%, $22,587.3M
- FY2005: 19.2%, $25,853.0M
- FY2006: 16.7%, $29,219.4M
- FY2010: 11.0%, $27,557.4M

**Source find:** the actual John Harvard Letters for FY2000-2006 were never
archived — hmc.harvard.edu itself has no Wayback captures before 2007. The
Harvard *University* Financial Report (published by the VP for Finance, at
the now-dead vpf-web.harvard.edu, predecessor to finance.harvard.edu) fills
the gap instead, and it over-delivers: each year's "Analysis of Financial
Results" section prints a rolling 5-year "Summary of Financial Results"
table with an explicit fiscal-year column header and a
"Total return on general investments" + "Net assets — endowment [funds]"
row. Five of these tables (FY2002/03/04/05/06 editions) overlap enough to
cross-confirm every one of FY2000-2006 two-to-four times over, from
documents that explicitly date each column — no as-of-dating judgment call
needed here at all, unlike Harvard's allocation tables.

**[JUDGMENT CALL] Parenthesized negatives, confirmed the hard way.** FY2001
and FY2002 print as `(2.7%)` and `( 0.5%)` / `(0.5%)` in every one of the
five overlapping tables. Read the prose in the FY2002 report before trusting
the parens: "In fiscal 2002, total return on generally invested endowment
was a negative 0.5%, compared with a negative 2.7% in fiscal 2001." Stored
both as -2.7 and -0.5. This is exactly the sign-flip precedent the brief
warned about, and it recurred here on schedule.

**[JUDGMENT CALL] FY2010 has no HMC letter at all.** No John Harvard Letter
or HMC annual endowment report for FY2010 was found archived anywhere under
hmc.harvard.edu (confirmed by full-domain CDX search); HMC's next own report
found is `Final_Annual_Report_2011.pdf`, which covers only FY2011 and does
not restate FY2010. Used the Harvard University Financial Report FY2010
instead (President's message: "our endowment portfolio earned an investment
return of 11.0% and had a year-end value of $27.6 billion"; audited
Summary-of-Financial-Results table: Net assets–endowment funds $27,557.4M).
Independent press coverage citing an HMC statement (Harvard Magazine and The
Harvard Crimson, both Sept. 2010) confirms the 11.0% return exactly but
gives the endowment's value as **$27.4 billion**, not $27.6 billion. Judged
this is not a transcription conflict but a scope difference Harvard itself
draws elsewhere in its own materials: $27.4bn is HMC's broader "endowment and
related assets" pool (also includes pension/working-capital money HMC
manages alongside the endowment), while $27.6bn / $27,557.4M is the
University's own audited "Net assets — endowment funds" line, i.e. the
endowment itself — the scope this dataset's `marketValueUsdMillions` is
meant to capture in every other row. Used the University figure. Flagging
here per Article 4 rather than silently picking one.

**Split-provenance count: 0.** Every year's return and market value came
from the same single document (the return appears in prose and the market
value in either the same prose sentence or the same table), so
`returnSourceId` and `marketValueSourceId` are identical on every new row.

**Sandbox validation:** `npx tsx scripts/seed.ts --dry-run --data-dir
<scratch>/data` exits 0. Full output (10 warnings, all pre-existing and
unrelated to these 8 rows — proxy-mapping and benchmark-series gaps that are
task 1.7/1.4 scope) is in the worker report for task 1.6.D.

**Gotcha worth carrying forward:** the Wayback capture at
`vpf-web.harvard.edu/annualfinancial/pdfs/2006discussion.pdf` under its
first-listed CDX timestamp (`20080708144908`) is truncated — 100KB where the
sibling captures run 500KB-1.5MB, and it fails to parse as a valid PDF
(`Invalid object in /Pages`). The CDX API lists multiple captures per URL;
a later one (`20100706200457`, 647KB) is intact. Worth checking `length` in
the CDX record, not just status 200, when a capture looks unusually small.

**Proposed TASKS.md wording (conductor to apply — not touched here):**
Task 1.5/1.6 build log — Harvard: "Harvard's returns/market-value series is
now complete for FY2000-FY2025 (26 years, no gaps). The FY2000-FY2006 and
FY2010 tail was closed via the Harvard University Financial Report (not an
HMC document) for each of those years, since no John Harvard Letter was ever
web-published for FY2000-2006 and none exists at all for FY2010; see
`data/sources.json` ids `hmc-university-financial-report-{2002..2006,2010}`
and the task 1.6.D build log for the FY2010 $27.6bn-vs-$27.4bn scope note."
