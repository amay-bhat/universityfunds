import type { SchoolId } from "./constants";

// Plain-English story blurbs (task 3.1). Sourcing discipline: every number
// here is computable from the seeded database (verified at write time —
// build log 2026-08-04), and every strategy description is attributed to the
// school's own published reports, all of which are cited in `sources` and
// listed on the methodology page. No claim in these blurbs rests on anything
// outside those two buckets.

export const SCHOOL_HOOK: Record<SchoolId, string> = {
  yale: "The pioneer of the famous endowment model — and the reason this site exists.",
  harvard: "The biggest endowment in dollars, with a bumpier ride than its size suggests.",
  stanford: "The school whose endowment numbers mostly aren't public — an honest gap.",
  mit: "The quiet outperformer that discloses the least along the way.",
  princeton: "The heaviest private-equity tilt in this data, per student the richest of the five.",
};

export const SCHOOL_BLURB: Record<SchoolId, string[]> = {
  yale: [
    "Yale is where the famous strategy comes from. Its own endowment reports describe the approach David Swensen built from the mid-1980s: shrink ordinary stocks and bonds to a sliver, and move the money into things most investors can't buy — private equity and venture capital, hedge funds (Yale calls the category “absolute return”), timber, oil and gas, and real estate. In this data you can watch it happen: in FY2000 Yale still held 14.2% in US stocks; by FY2020, the last year it disclosed a mix, that was down to 2.3%, with about 73% of the portfolio in the alternative categories.",
    "Did it work? Over the 26 years here, Yale compounded at 11.2% a year, against 7.9% for the S&P 500 — the endowment grew from $10.1 billion to $44.1 billion while also paying out a slice to the university every year. The model's worst moment is in the data too: FY2009, when the portfolio lost 24.6% — the exotic assets did not protect it in the financial crisis.",
    "One honesty note: Yale stopped publishing its allocation mix after its 2020 report, so the mix chart below ends at FY2020 while the returns run to FY2025. Nothing here is estimated to fill that gap.",
  ],
  harvard: [
    "Harvard's endowment is the largest in this data — $19.1 billion in FY2000, $56.9 billion by FY2025 — run by Harvard Management Company, which historically managed much of the money in-house rather than through outside funds. Its reports from 2017 onward describe a deep restructuring: shrinking internal teams, moving to outside managers, and simplifying how the portfolio is reported.",
    "That reporting history shapes what you'll see below. Before FY2017 Harvard published only its target mix — the “policy portfolio” it was aiming for — not what it actually held, so those years are labelled as targets. From FY2017 it reports actual holdings, but combines US and international stocks into a single “public equity” line. And two years (FY2018 and FY2022) were never published at all; they appear as honest holes.",
    "The returns tell a humbler story than the size does: 9.0% a year over these 26 years — well ahead of the S&P 500's 7.9%, but the FY2009 crash year (−27.3%) was the deepest of the five schools, and the decade after it lagged the peers you can compare it against here.",
  ],
  stanford: [
    "Stanford is the honest gap in this project. Its investment office, Stanford Management Company, publishes an asset mix and returns only for the Merged Pool — a big shared pot that contains the endowment (roughly three-quarters of it) plus hospital money and other university funds. The endowment's own mix and returns have never been published separately, and the two genuinely differ: in FY2024, for example, the endowment's audited investment result works out several percentage points below the Merged Pool's reported return.",
    "Showing Merged Pool numbers and calling them “Stanford's endowment” would quietly swap one portfolio for another — exactly the kind of thing this site exists to avoid. So Stanford's page shows the one figure Stanford does publish cleanly for the endowment itself: its size. That grew from $8.9 billion in FY2000 to $40.8 billion in FY2025.",
    "Two quirks worth knowing: Stanford's fiscal year ends August 31 (the other four schools end June 30), so its values sit about two months offset from every other series here; and the full story of why its mix and returns are missing — with sources — is on the methodology page.",
  ],
  mit: [
    "MIT's endowment is run by MIT Investment Management Company (MITIMCo), and by the numbers it is the quiet star of this data: 10.6% a year over 26 years, second only to Yale here, growing from $6.5 billion to $27.4 billion. Its best year is the very first — a 55.6% moonshot in FY2000, at the top of the dot-com boom — and its worst, FY2009's −17.1%, was the mildest crash year of the five schools.",
    "The catch is disclosure. MIT publishes an annual return every year but almost never a full asset mix: this data contains just seven scattered allocation years. Three of them — FY2001, FY2003 and FY2004 — describe MIT's investment pool rather than the endowment proper, a slightly wider pot of money; the other four (FY2008, FY2013, FY2014 and FY2015) are endowment figures, every one of them drawn from MIT's written answers to two congressional inquiries — the only place it ever published those tables.",
    "So read MIT's mix chart as a set of snapshots, not a movie: single disclosed years with real gaps between them, shown exactly as sparse as the public record is.",
  ],
  princeton: [
    "Princeton's endowment, managed by the Princeton University Investment Company (PRINCO), runs the most aggressive version of the endowment model in this data. In its most recent disclosed mix (FY2023), private equity and venture capital alone were 39.9% of the portfolio, with another 23.4% in hedge funds — meaning roughly two-thirds of the endowment sat in things an ordinary investor cannot buy.",
    "Over the 24 years with published returns (Princeton never reported FY2000 or FY2003; those are real gaps, not zeros), it compounded at 9.5% a year, carrying the endowment from $11.2 billion in FY2005 to $35.7 billion in FY2025. Its FY2021 result — +46.9% in a single year, driven by the venture boom — is the second-biggest year anywhere in this data, and its FY2009 (−23.5%) shows the same crash vulnerability as its peers.",
  ],
};
