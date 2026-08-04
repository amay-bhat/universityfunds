import type { AllocationCategory } from "./constants";
import { ALLOCATION_CATEGORY_LABELS } from "./constants";

// Fixed slot assignments (dataviz skill: categorical hues in fixed order,
// color follows the entity, never its rank — a school that lacks a category
// must not repaint the survivors, and the same category wears the same hue on
// every school's chart).
export const CATEGORY_SLOT: Record<AllocationCategory, number> = {
  us_public_equity: 1,
  intl_public_equity: 2,
  public_equity: 3,
  fixed_income_cash: 4,
  absolute_return: 5,
  private_equity_vc: 6,
  real_assets: 7,
  other: 8,
};

// Comparison-series entities keep one hue everywhere they appear (the S&P 500
// is aqua on the returns overlay AND on the compare chart).
export const ENTITY_SLOT = {
  endowment: 1,
  copycat: 2,
  sp500: 3,
  sixty_forty: 4,
  seventy_thirty: 5,
} as const;

export type ComparisonEntity = keyof typeof ENTITY_SLOT;

export const ENTITY_LABEL: Record<ComparisonEntity, string> = {
  endowment: "Endowment (actual)",
  copycat: "ETF copycat",
  sp500: "S&P 500",
  sixty_forty: "60/40",
  seventy_thirty: "70/30",
};

export function slotColor(slot: number): string {
  return `var(--series-${slot})`;
}

export function categoryColor(category: AllocationCategory): string {
  return slotColor(CATEGORY_SLOT[category]);
}

export function categoryLabel(category: AllocationCategory): string {
  return ALLOCATION_CATEGORY_LABELS[category];
}

// Stack order = slot order, so vertically adjacent stack segments are
// adjacent palette slots — the ordering the validator's adjacent pairlist
// certifies.
export const CATEGORY_STACK_ORDER: AllocationCategory[] = (
  Object.entries(CATEGORY_SLOT) as [AllocationCategory, number][]
)
  .sort((a, b) => a[1] - b[1])
  .map(([c]) => c);
