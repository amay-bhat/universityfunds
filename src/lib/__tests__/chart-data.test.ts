import { describe, expect, it } from "vitest";
import { toAllocationChartData, toMarketValueData, toReturnsChartData } from "../chart-data";
import type { AllocationRow, BenchmarkReturnRow, EndowmentReturnRow } from "../queries";

const alloc = (
  fiscalYear: number,
  category: AllocationRow["category"],
  pct: number,
  basis: "actual" | "target" = "actual",
  sourceId = "s",
): AllocationRow => ({ fiscalYear, category, pct, basis, sourceLabel: null, sourceId });

// The one citation whose sources.json notes state a wider measurement universe.
const POOL_SRC = "mitimco-fnl-bufferd-2004";

describe("toAllocationChartData", () => {
  it("returns null for a school with no allocation rows (Stanford)", () => {
    expect(toAllocationChartData([])).toBeNull();
  });

  it("spans only the disclosed coverage and orders categories by fixed stack order", () => {
    const data = toAllocationChartData([
      alloc(2000, "real_assets", 20),
      alloc(2000, "us_public_equity", 80),
      alloc(2001, "real_assets", 30),
      alloc(2001, "us_public_equity", 70),
    ])!;
    expect(data.coverageStart).toBe(2000);
    expect(data.coverageEnd).toBe(2001);
    expect(data.gapYears).toEqual([]);
    // us_public_equity (slot 1) before real_assets (slot 7), regardless of
    // input order — color/stack order follows the entity, never the data.
    expect(data.categoriesUsed).toEqual(["us_public_equity", "real_assets"]);
    expect(data.targetYears).toEqual([]);
    expect(data.targetsFormPrefix).toBe(false);
    expect(data.poolYears).toEqual([]);
  });

  it("emits unpublished years inside the window as explicit gaps (Harvard FY2018/FY2022)", () => {
    const data = toAllocationChartData([
      alloc(2017, "public_equity", 100),
      alloc(2019, "public_equity", 100),
    ])!;
    expect(data.years.map((y) => y.fiscalYear)).toEqual([2017, 2018, 2019]);
    expect(data.gapYears).toEqual([2018]);
    expect(data.years[1].basis).toBeNull();
    expect(data.years[1].values).toEqual({});
  });

  it("tracks target-basis years as a contiguous prefix (Harvard policy-portfolio era)", () => {
    const data = toAllocationChartData([
      alloc(2005, "public_equity", 100, "target"),
      alloc(2006, "public_equity", 100, "target"),
      alloc(2007, "public_equity", 100, "actual"),
    ])!;
    expect(data.targetYears).toEqual([2005, 2006]);
    // Harvard's shape: the chart may legitimately say "through FY2006".
    expect(data.targetsFormPrefix).toBe(true);
  });

  // REGRESSION. This shipped publicly: lastTargetYear was max(target years), so
  // MIT — whose only target year sits mid-series — was captioned "targets
  // through FY2008", asserting that FY2001/FY2003/FY2004 were targets. They are
  // actuals.
  it("does not treat a mid-series target year as a prefix boundary (MIT)", () => {
    const data = toAllocationChartData([
      alloc(2001, "public_equity", 100, "actual", POOL_SRC),
      alloc(2003, "public_equity", 100, "actual", POOL_SRC),
      alloc(2004, "public_equity", 100, "actual", POOL_SRC),
      alloc(2008, "public_equity", 100, "target"),
      alloc(2013, "public_equity", 100, "actual"),
    ])!;
    expect(data.targetYears).toEqual([2008]);
    expect(data.targetsFormPrefix).toBe(false);
    const byYear = new Map(data.years.map((y) => [y.fiscalYear, y]));
    expect(byYear.get(2001)!.basis).toBe("actual");
    expect(byYear.get(2004)!.basis).toBe("actual");
    expect(byYear.get(2008)!.basis).toBe("target");
  });

  it("derives the measurement universe from the citation, not a stored column", () => {
    const data = toAllocationChartData([
      alloc(2001, "public_equity", 100, "actual", POOL_SRC),
      alloc(2003, "public_equity", 100, "actual", POOL_SRC),
      alloc(2008, "public_equity", 100, "actual"),
    ])!;
    expect(data.poolYears).toEqual([2001, 2003]);
    const byYear = new Map(data.years.map((y) => [y.fiscalYear, y]));
    expect(byYear.get(2001)!.universe).toBe("investment_pool");
    expect(byYear.get(2008)!.universe).toBe("endowment");
    // A gap year asserts no universe at all.
    expect(byYear.get(2002)!.universe).toBeNull();
  });

  it("will not call a year pool-basis unless every one of its rows says so", () => {
    // A mixed year would be a curation error; defaulting to "endowment" keeps
    // the chart from silently claiming the wider pot.
    const data = toAllocationChartData([
      alloc(2001, "public_equity", 60, "actual", POOL_SRC),
      alloc(2001, "real_assets", 40, "actual", "some-endowment-doc"),
    ])!;
    expect(data.poolYears).toEqual([]);
    expect(data.years[0].universe).toBe("endowment");
  });

  // The on-chart boundary annotation (pool-basis ruling obligation 5, limb 2) is
  // only honest for a prefix, so the prefix test gates which treatment is used.
  it("reports MIT's pool years as a prefix, so a boundary annotation is legitimate", () => {
    const data = toAllocationChartData([
      alloc(2001, "public_equity", 100, "actual", POOL_SRC),
      alloc(2003, "public_equity", 100, "actual", POOL_SRC),
      alloc(2004, "public_equity", 100, "actual", POOL_SRC),
      alloc(2008, "public_equity", 100, "target"),
      alloc(2013, "public_equity", 100, "actual"),
    ])!;
    expect(data.poolYears).toEqual([2001, 2003, 2004]);
    expect(data.poolYearsFormPrefix).toBe(true);
    // Gap years between pool years do not become pool years.
    expect(data.poolYears).not.toContain(2002);
  });

  it("refuses the prefix claim when a pool year sits mid-series", () => {
    const data = toAllocationChartData([
      alloc(2001, "public_equity", 100, "actual"),
      alloc(2003, "public_equity", 100, "actual", POOL_SRC),
      alloc(2005, "public_equity", 100, "actual"),
    ])!;
    expect(data.poolYears).toEqual([2003]);
    // FY2001 is endowment-basis and precedes the pool year, so no boundary line
    // may be drawn; the chart must mark FY2003 individually instead.
    expect(data.poolYearsFormPrefix).toBe(false);
  });
});

const ret = (fiscalYear: number, returnPct: number | null): EndowmentReturnRow => ({
  fiscalYear,
  returnPct,
  marketValueUsdMillions: null,
  returnSourceId: returnPct === null ? null : "s",
  marketValueSourceId: null,
});

const bench = (fiscalYear: number, returnPct: number): BenchmarkReturnRow => ({
  series: "sp500",
  fiscalYear,
  returnPct,
  sourceId: "s",
});

describe("toReturnsChartData", () => {
  it("clips the overlay to the school's coverage window and keeps holes", () => {
    const points = toReturnsChartData(
      [ret(2001, 5), ret(2002, null), ret(2003, 7)],
      [bench(2000, 1), bench(2001, 2), bench(2002, 3), bench(2003, 4), bench(2004, 5)],
    );
    expect(points.map((p) => p.fiscalYear)).toEqual([2001, 2002, 2003]);
    expect(points[1].school).toBeNull(); // unpublished year stays a hole
    expect(points.map((p) => p.sp500)).toEqual([2, 3, 4]); // 2000/2004 clipped
  });

  it("a school with no returns (Stanford) yields no points", () => {
    expect(toReturnsChartData([ret(2020, null)], [bench(2020, 1)])).toEqual([]);
  });
});

describe("toMarketValueData", () => {
  it("keeps only valued years, sorted", () => {
    const rows: EndowmentReturnRow[] = [
      { ...ret(2002, null), marketValueUsdMillions: 200 },
      { ...ret(2001, null), marketValueUsdMillions: 100 },
      ret(2003, 5),
    ];
    expect(toMarketValueData(rows)).toEqual([
      { fiscalYear: 2001, marketValueUsdMillions: 100 },
      { fiscalYear: 2002, marketValueUsdMillions: 200 },
    ]);
  });
});
