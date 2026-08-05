import { describe, expect, it } from "vitest";
import { GLOSSARY, GLOSSARY_ENTRIES, glossarySlug } from "../glossary";

describe("glossarySlug", () => {
  it("makes url-safe fragments out of the awkward terms", () => {
    expect(glossarySlug("S&P 500")).toBe("s-p-500");
    expect(glossarySlug("60/40")).toBe("60-40");
    expect(glossarySlug("growth of $10,000")).toBe("growth-of-10-000");
    expect(glossarySlug("ETF")).toBe("etf");
  });

  it("leaves no leading or trailing separator", () => {
    expect(glossarySlug("$10,000!")).toBe("10-000");
  });
});

describe("GLOSSARY_ENTRIES", () => {
  it("carries every glossary term, exactly once", () => {
    const terms = GLOSSARY_ENTRIES.map((e) => e.term);
    expect(terms).toHaveLength(Object.keys(GLOSSARY).length);
    expect(new Set(terms).size).toBe(terms.length);
  });

  // A collision would silently make one term's /glossary#anchor unreachable.
  it("has a unique slug per term", () => {
    const slugs = GLOSSARY_ENTRIES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((s) => /^[a-z0-9][a-z0-9-]*$/.test(s))).toBe(true);
  });

  it("is alphabetical, case-insensitively and numerically aware", () => {
    const terms = GLOSSARY_ENTRIES.map((e) => e.term);
    const sorted = [...terms].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base", numeric: true }),
    );
    expect(terms).toEqual(sorted);
    // "60/40" reads as sixty-forty, so it leads; "ETF" files under E, not ahead
    // of every lowercase term.
    expect(terms[0]).toBe("60/40");
    expect(terms.indexOf("ETF")).toBeGreaterThan(terms.indexOf("endowment"));
  });

  it("defines every term in plain prose, not a stub", () => {
    for (const { term, definition } of GLOSSARY_ENTRIES) {
      expect(definition.length, term).toBeGreaterThan(40);
      expect(definition.trim(), term).toBe(definition);
      expect(definition.endsWith("."), term).toBe(true);
    }
  });

  it("hands the page the same text <Term> floats inline", () => {
    for (const { term, definition } of GLOSSARY_ENTRIES) {
      expect(definition).toBe(GLOSSARY[term]);
    }
  });
});
