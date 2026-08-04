// One shared glossary so a term is defined identically everywhere it appears
// (PRD rule 3: define any term a smart 22-year-old outside finance wouldn't
// know, on first use). Pages surface these through <Term> — see
// src/components/Term.tsx.

export const GLOSSARY = {
  endowment:
    "A university's long-term investment fund, built from donations, that pays out a slice each year to support the school.",
  "asset allocation":
    "How a portfolio is divided among investment types — stocks, bonds, real estate and so on — usually shown as percentages adding up to 100.",
  "fiscal year":
    "A school's 12-month accounting year. Here FY2025 means July 2024 through June 2025 for four of the schools; Stanford's runs September through August.",
  ETF: "Exchange-traded fund — a fund holding a basket of investments that trades on a stock exchange like a single share. The kind of thing anyone with a brokerage account can buy.",
  benchmark:
    "A simple reference portfolio, like the S&P 500, used as a yardstick to judge performance against.",
  "S&P 500":
    "An index of about 500 of the largest US companies — the standard shorthand for 'the US stock market.' We use its total-return version, which includes reinvested dividends.",
  "60/40":
    "A classic simple portfolio: 60% stocks, 40% bonds. Its cousin 70/30 holds 70% stocks and 30% bonds.",
  "annualized return":
    "The single per-year growth rate that would produce the same overall result as the actual year-by-year returns. Useful for comparing periods of different lengths.",
  rebalancing:
    "Trading back to your target mix after market moves push it off target. This site's copycat portfolios rebalance once a year.",
  copycat:
    "Our name for the do-it-yourself version of an endowment's mix, built from ordinary ETFs standing in for each investment type.",
  "market value":
    "The total dollar size of the endowment at the end of its fiscal year.",
  "Merged Pool":
    "Stanford's combined investment pool. It holds the endowment plus hospital and other university money, so its published numbers describe a bigger, different portfolio than the endowment itself.",
  "absolute return":
    "Endowment-speak for hedge funds — private investment partnerships that try to make money in both rising and falling markets. Not something an ordinary investor can buy.",
  "private equity":
    "Buying stakes in companies that don't trade on a stock exchange, including venture capital's stakes in young startups. The money is typically locked up for years.",
  "real assets":
    "Physical-world investments: real estate, timberland, oil and gas. Endowments mostly hold these directly, in forms no ordinary fund replicates.",
  "total return":
    "Price change plus dividends, with the dividends reinvested. The honest way to measure what an investment actually earned.",
  "growth of $10,000":
    "A standard way to picture returns: what a $10,000 investment at the start of the period would have grown to, year by year.",
  "target allocation":
    "The mix a school said it was aiming for (its 'policy portfolio'), as opposed to what it actually held. Harvard published only targets before 2017 — the two are labelled differently everywhere on this site.",
  REIT: "Real estate investment trust — a company that owns income-producing property and trades on a stock exchange, letting ordinary investors own real estate the way they own stocks.",
} as const;

export type GlossaryTerm = keyof typeof GLOSSARY;
