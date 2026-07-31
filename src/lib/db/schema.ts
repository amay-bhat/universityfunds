import {
  pgTable,
  text,
  integer,
  numeric,
  serial,
  unique,
} from "drizzle-orm/pg-core";

// Dimension tables — natural (slug) primary keys, stable across curation sessions.

export const schools = pgTable("schools", {
  id: text("id").primaryKey(), // slug, e.g. "yale"
  name: text("name").notNull(), // e.g. "Yale University"
  managerName: text("manager_name"), // e.g. "Yale Investments Office"
  website: text("website"),
});

export const sources = pgTable("sources", {
  id: text("id").primaryKey(), // slug, e.g. "yale-annual-report-fy2023"
  title: text("title").notNull(),
  publisher: text("publisher"), // e.g. "Yale Investments Office"
  url: text("url"),
  documentType: text("document_type").notNull(), // one of SOURCE_DOCUMENT_TYPES (src/lib/constants.ts)
  page: text("page"), // page number/range within the document, if applicable
  accessedDate: text("accessed_date"), // ISO date (YYYY-MM-DD) — when the curator pulled this figure
  notes: text("notes"),
});

// Fact tables — surrogate serial keys.

export const allocations = pgTable(
  "allocations",
  {
    id: serial("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id),
    fiscalYear: integer("fiscal_year").notNull(), // year the fiscal year ENDS (FY2025 = July 2024–June 2025)
    category: text("category").notNull(), // one of ALLOCATION_CATEGORIES (src/lib/constants.ts)
    pct: numeric("pct", { precision: 6, scale: 3 }).notNull(),
    // "actual" (held at fiscal year end) or "target" (published policy portfolio).
    // Harvard published only targets through FY2016 and only actuals from FY2017;
    // the two measure different things and must never render as one unlabeled
    // series. Defaults to "actual" so every already-curated row stays correct.
    basis: text("basis").notNull().default("actual"),
    sourceLabel: text("source_label"), // the school's own original wording for this line item, for audit traceability
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
  },
  (t) => [unique().on(t.schoolId, t.fiscalYear, t.category)],
);

export const endowmentReturns = pgTable(
  "endowment_returns",
  {
    id: serial("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id),
    fiscalYear: integer("fiscal_year").notNull(),
    returnPct: numeric("return_pct", { precision: 6, scale: 3 }),
    marketValueUsdMillions: numeric("market_value_usd_millions", {
      precision: 12,
      scale: 2,
    }),
    // Each figure carries its own citation: a school-year's return often comes
    // from a different document than its market value (investment-office
    // release vs. financial report), and UNIQUE(school, fiscal_year) forbids a
    // second row — a single source_id forced one figure to cite a document
    // that doesn't contain it. Nullable in the schema because each is required
    // exactly when its figure is present, which the seed validator enforces
    // (human-approved rail change, 2026-07-30 — see the build log).
    returnSourceId: text("return_source_id").references(() => sources.id),
    marketValueSourceId: text("market_value_source_id").references(() => sources.id),
  },
  (t) => [unique().on(t.schoolId, t.fiscalYear)],
);

export const benchmarkReturns = pgTable(
  "benchmark_returns",
  {
    id: serial("id").primaryKey(),
    series: text("series").notNull(), // one of BENCHMARK_SERIES (src/lib/constants.ts)
    fiscalYear: integer("fiscal_year").notNull(),
    returnPct: numeric("return_pct", { precision: 6, scale: 3 }).notNull(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
  },
  (t) => [unique().on(t.series, t.fiscalYear)],
);

export const proxyMappings = pgTable("proxy_mappings", {
  category: text("category").primaryKey(), // one of ALLOCATION_CATEGORIES
  etfTicker: text("etf_ticker").notNull(),
  etfName: text("etf_name").notNull(),
  rationale: text("rationale").notNull(), // plain-English: why this ETF represents the category
  honestyNote: text("honesty_note").notNull(), // plain-English: what this proxy can't actually replicate
  sourceId: text("source_id").references(() => sources.id),
});
