// Geometry for the floating definition bubble (<Term>). Pure and unit-tested
// (src/lib/__tests__/bubble-position.test.ts) so the placement rules are
// verifiable without a browser: the component only feeds it measured rects.
//
// Why a bubble needs real geometry here: <Term> is used inside an
// `overflow-x-auto` table header (the Compare page's "Annualized return"
// column), so the bubble is rendered through a portal at the document root
// with `position: fixed` and positioned from the trigger's viewport rect. That
// escapes every clipping ancestor — the reason the first version of this
// component settled for pushing text inline instead.

export const BUBBLE_GAP = 8; // px between the word and the bubble
export const BUBBLE_MARGIN = 12; // px minimum clearance from the viewport edge
export const BUBBLE_MAX_WIDTH = 320;
const ARROW_INSET = 14; // keeps the arrow within the bubble's rounded corners

export type Rect = { left: number; right: number; top: number; bottom: number };
export type Size = { width: number; height: number };
export type Viewport = { width: number; height: number };

export type BubblePlacement = {
  left: number;
  top: number;
  /** Arrow offset from the bubble's own left edge. */
  arrowLeft: number;
  /** True when the bubble sits above the word (not enough room below). */
  above: boolean;
};

function clamp(value: number, min: number, max: number): number {
  // max < min happens on very narrow viewports; the low edge wins so the
  // bubble never lands off-screen left.
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

/** Width the bubble should be laid out at, given the viewport. */
export function bubbleWidth(viewportWidth: number): number {
  return Math.min(BUBBLE_MAX_WIDTH, Math.max(0, viewportWidth - 2 * BUBBLE_MARGIN));
}

/**
 * True when the word has scrolled out of sight. A bubble whose word is gone is
 * orphaned — it reads as a stray box stuck to the edge of the screen — so the
 * component closes it instead of dragging it along.
 */
export function isTriggerOffscreen(trigger: Rect, viewport: Viewport): boolean {
  return (
    trigger.bottom <= 0 ||
    trigger.top >= viewport.height ||
    trigger.right <= 0 ||
    trigger.left >= viewport.width
  );
}

/**
 * Places the bubble under the word, flipping above only when it genuinely
 * doesn't fit below AND there is more room above, then clamping into the
 * viewport on both axes. Centered on the word; the arrow tracks the word after
 * the clamp so it still points at it.
 */
export function computeBubblePosition(
  trigger: Rect,
  bubble: Size,
  viewport: Viewport,
): BubblePlacement {
  const roomBelow = viewport.height - trigger.bottom - BUBBLE_GAP - BUBBLE_MARGIN;
  const roomAbove = trigger.top - BUBBLE_GAP - BUBBLE_MARGIN;
  const above = bubble.height > roomBelow && roomAbove > roomBelow;

  // Clamped vertically too: a definition taller than the space either side of
  // the word (a long definition on a short window) would otherwise hang off the
  // bottom edge with its first line unreadable. Pinning it shows the start.
  const top = clamp(
    above ? trigger.top - BUBBLE_GAP - bubble.height : trigger.bottom + BUBBLE_GAP,
    BUBBLE_MARGIN,
    viewport.height - bubble.height - BUBBLE_MARGIN,
  );

  const center = (trigger.left + trigger.right) / 2;
  const left = clamp(
    center - bubble.width / 2,
    BUBBLE_MARGIN,
    viewport.width - bubble.width - BUBBLE_MARGIN,
  );

  const arrowLeft = clamp(center - left, ARROW_INSET, bubble.width - ARROW_INSET);

  return { left, top, arrowLeft, above };
}
