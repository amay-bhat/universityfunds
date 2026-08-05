import { describe, expect, it } from "vitest";
import {
  bubbleMaxHeight,
  bubbleWidth,
  computeBubblePosition,
  isTriggerOffscreen,
} from "../bubble-position";

// Every expected value below is computed by hand from the constants
// (GAP 8, MARGIN 12, MAX_WIDTH 320), never by running the code under test.

describe("bubbleWidth", () => {
  it("caps at the max width on wide viewports", () => {
    expect(bubbleWidth(1280)).toBe(320); // min(320, 1280 - 24)
    expect(bubbleWidth(375)).toBe(320); // min(320, 351)
  });

  it("shrinks to fit narrow viewports, keeping both margins", () => {
    expect(bubbleWidth(320)).toBe(296); // 320 - 2*12
    expect(bubbleWidth(200)).toBe(176);
  });

  it("never goes negative", () => {
    expect(bubbleWidth(10)).toBe(0);
  });
});

describe("bubbleMaxHeight", () => {
  it("leaves a margin at top and bottom", () => {
    expect(bubbleMaxHeight(800)).toBe(776);
    expect(bubbleMaxHeight(340)).toBe(316); // landscape phone
  });

  it("never goes negative", () => {
    expect(bubbleMaxHeight(10)).toBe(0);
  });

  // The point of the cap: at 200% text zoom a long definition can measure taller
  // than the whole viewport. Capped, it scrolls inside the bubble; uncapped, the
  // screen edge cut it off with no way to reach the rest (WCAG 1.4.4).
  it("bounds the bubble so a placement always fits on screen", () => {
    const viewport = { width: 667, height: 340 };
    const height = bubbleMaxHeight(viewport.height);
    const p = computeBubblePosition(
      { left: 100, right: 200, top: 140, bottom: 171 },
      { width: bubbleWidth(viewport.width), height },
      viewport,
    );
    expect(p.top).toBeGreaterThanOrEqual(12);
    expect(p.top + height).toBeLessThanOrEqual(340 - 12);
  });
});

describe("isTriggerOffscreen", () => {
  const viewport = { width: 1280, height: 800 };

  it("is false while any part of the word is visible", () => {
    expect(isTriggerOffscreen({ left: 100, right: 140, top: 300, bottom: 316 }, viewport)).toBe(false);
    // Half-scrolled off the top and off the bottom: still partly visible.
    expect(isTriggerOffscreen({ left: 100, right: 140, top: -8, bottom: 8 }, viewport)).toBe(false);
    expect(isTriggerOffscreen({ left: 100, right: 140, top: 795, bottom: 811 }, viewport)).toBe(false);
  });

  it("is true once the word has scrolled fully out of sight", () => {
    expect(isTriggerOffscreen({ left: 100, right: 140, top: -40, bottom: -20 }, viewport)).toBe(true);
    expect(isTriggerOffscreen({ left: 100, right: 140, top: 820, bottom: 840 }, viewport)).toBe(true);
    // Scrolled sideways out of a horizontally-scrolling table.
    expect(isTriggerOffscreen({ left: -60, right: -10, top: 300, bottom: 316 }, viewport)).toBe(true);
    expect(isTriggerOffscreen({ left: 1300, right: 1340, top: 300, bottom: 316 }, viewport)).toBe(true);
  });
});

describe("computeBubblePosition", () => {
  it("sits below the word when there is room", () => {
    // roomBelow = 800 - 316 - 8 - 12 = 464 > height 100, so no flip.
    // top = 316 + 8 = 324. center = 120. left = clamp(120 - 160, 12, 948) = 12.
    expect(
      computeBubblePosition(
        { left: 100, right: 140, top: 300, bottom: 316 },
        { width: 320, height: 100 },
        { width: 1280, height: 800 },
      ),
    ).toEqual({ left: 12, top: 324, above: false });
  });

  it("flips above when it does not fit below and above is roomier", () => {
    // roomBelow = 800 - 716 - 20 = 64 < height 120; roomAbove = 680 > 64 → flip.
    // top = 700 - 8 - 120 = 572. center = 625. left = 625 - 160 = 465.
    expect(
      computeBubblePosition(
        { left: 600, right: 650, top: 700, bottom: 716 },
        { width: 320, height: 120 },
        { width: 1280, height: 800 },
      ),
    ).toEqual({ left: 465, top: 572, above: true });
  });

  it("prefers a roomier flip over squeezing the bubble", () => {
    // roomBelow = 800 - 700 - 20 = 80 < height 100, and roomAbove = 664 is far
    // roomier: 684 - 8 - 100 = 576.
    const p = computeBubblePosition(
      { left: 100, right: 140, top: 684, bottom: 700 },
      { width: 320, height: 100 },
      { width: 1280, height: 800 },
    );
    expect(p.above).toBe(true);
    expect(p.top).toBe(576);
  });

  it("clamps into the viewport when neither side fits and above is tighter", () => {
    // roomBelow = 300 - 56 - 20 = 224 < height 260, but roomAbove = 20 is worse,
    // so it stays below — and 56 + 8 = 64 would hang 36px off the bottom, so the
    // clamp pulls it to 300 - 260 - 12 = 28.
    const p = computeBubblePosition(
      { left: 100, right: 140, top: 40, bottom: 56 },
      { width: 320, height: 260 },
      { width: 1280, height: 300 },
    );
    expect(p.above).toBe(false);
    expect(p.top).toBe(28);
    expect(p.top + 260).toBe(288); // exactly the 12px bottom margin
  });

  it("clamps a flipped bubble to the top margin rather than off-screen", () => {
    // roomBelow = 200 - 116 - 20 = 64; roomAbove = 80 → flips, but
    // 100 - 8 - 150 = -58, so the top margin wins.
    const p = computeBubblePosition(
      { left: 100, right: 140, top: 100, bottom: 116 },
      { width: 320, height: 150 },
      { width: 1280, height: 200 },
    );
    expect(p.above).toBe(true);
    expect(p.top).toBe(12);
  });

  it("keeps a phone-width bubble on screen", () => {
    // A word near the right edge at 375px: left clamps to 375 - 320 - 12 = 43.
    expect(
      computeBubblePosition(
        { left: 330, right: 360, top: 100, bottom: 116 },
        { width: 320, height: 90 },
        { width: 375, height: 667 },
      ),
    ).toEqual({ left: 43, top: 124, above: false });
  });

  it("never lands off the left edge when the bubble is wider than the viewport", () => {
    // max clamp bound (viewport - width - margin) goes negative; the low edge wins.
    const p = computeBubblePosition(
      { left: 5, right: 15, top: 20, bottom: 36 },
      { width: 400, height: 80 },
      { width: 300, height: 500 },
    );
    expect(p.left).toBe(12);
  });

  // Invariant over a spread of positions and sizes rather than one case: the
  // bubble must always be fully on screen, whatever the word does. The bubble is
  // allowed to overlap its own word (which is why it carries no arrow), but it
  // may never leave the viewport.
  it("keeps every placement inside the viewport across a sweep", () => {
    for (const vh of [200, 340, 667, 800]) {
      for (const vw of [320, 375, 768, 1280]) {
        const width = bubbleWidth(vw);
        for (const h of [40, 90, 160, bubbleMaxHeight(vh)]) {
          const height = Math.min(h, bubbleMaxHeight(vh));
          for (let y = 0; y < vh; y += 17) {
            const p = computeBubblePosition(
              { left: 10, right: 90, top: y, bottom: y + 16 },
              { width, height },
              { width: vw, height: vh },
            );
            const where = `vw${vw} vh${vh} h${height} y${y}`;
            expect(p.left, where).toBeGreaterThanOrEqual(0);
            expect(p.top, where).toBeGreaterThanOrEqual(0);
            expect(p.left + width, where).toBeLessThanOrEqual(vw);
            expect(p.top + height, where).toBeLessThanOrEqual(vh);
          }
        }
      }
    }
  });
});
