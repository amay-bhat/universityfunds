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
//
// There is deliberately no arrow/tail. A tail has to promise which word the
// bubble belongs to, and on a short viewport the bubble can legitimately end up
// clamped over its own word, at which point the tail points at nothing. The
// bubble names its term in bold instead, which is true at every size.

export const BUBBLE_GAP = 8; // px between the word and the bubble
export const BUBBLE_MARGIN = 12; // px minimum clearance from the viewport edge
export const BUBBLE_MAX_WIDTH = 320;

export type Rect = { left: number; right: number; top: number; bottom: number };
export type Size = { width: number; height: number };
export type Viewport = { width: number; height: number };

export type BubblePlacement = {
  left: number;
  top: number;
  /** True when the bubble sits above the word (not enough room below). */
  above: boolean;
};

function clamp(value: number, min: number, max: number): number {
  // max < min happens on very narrow viewports; the low edge wins so the
  // bubble never lands off-screen left or above.
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

/** Width the bubble should be laid out at, given the viewport. */
export function bubbleWidth(viewportWidth: number): number {
  return Math.min(BUBBLE_MAX_WIDTH, Math.max(0, viewportWidth - 2 * BUBBLE_MARGIN));
}

/**
 * Tallest the bubble may be. Capped to the viewport so a long definition at
 * large text zoom scrolls inside the bubble instead of being cut off by the
 * screen edge with no way to reach the rest of it (WCAG 1.4.4).
 */
export function bubbleMaxHeight(viewportHeight: number): number {
  return Math.max(0, viewportHeight - 2 * BUBBLE_MARGIN);
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
 * viewport on both axes. Centered on the word horizontally.
 */
export function computeBubblePosition(
  trigger: Rect,
  bubble: Size,
  viewport: Viewport,
): BubblePlacement {
  const roomBelow = viewport.height - trigger.bottom - BUBBLE_GAP - BUBBLE_MARGIN;
  const roomAbove = trigger.top - BUBBLE_GAP - BUBBLE_MARGIN;
  const above = bubble.height > roomBelow && roomAbove > roomBelow;

  // Clamped vertically as well as horizontally: a definition taller than the
  // space on the chosen side would otherwise hang off the edge with its first
  // line unreadable. Pinning it keeps the whole bubble on screen — at the cost
  // of it sometimes covering its own word on a short viewport, which is why
  // there is no arrow to point at the word (see the file header).
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

  return { left, top, above };
}
