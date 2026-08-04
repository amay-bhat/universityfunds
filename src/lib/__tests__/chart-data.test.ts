import { describe, expect, it } from "vitest";
import { toAllocationChartData, toMarketValueData, toReturnsChartData } from "../chart-data";
import type { AllocationRow, BenchmarkReturnRow, EndowmentReturnRow } from "../queries";

const alloc = (
  fiscalYear: number,
  category: AllocationRow["category"],
  pct: number,
  basis: "actual" | "target" = "actual",
): AllocationRow => ({ fiscalYear, category, pct, basis, sourceLabel: null, sourceId: "s" });

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
    expect(data.lastTargetYear).toBeNull();
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

  it("tracks the last target-basis year (Harvard policy-portfolio era)", () => {
    const data = toAllocationChartData([
      alloc(2005, "public_equity", 100, "target"),
      alloc(2006, "public_equity", 100, "target"),
      alloc(2007, "public_equity", 100, "actual"),
    ])!;
    expect(data.lastTargetYear).toBe(2006);
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
