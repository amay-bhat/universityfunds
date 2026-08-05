import { describe, expect, it } from "vitest";
import { bubbleWidth, computeBubblePosition, isTriggerOffscreen } from "../bubble-position";

// Every expected value below is computed by hand from the constants
// (GAP 8, MARGIN 12, MAX_WIDTH 320, ARROW_INSET 14), never by running the code
// under test.

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
  it("sits below the word when there is room, arrow pointing at it", () => {
    // roomBelow = 800 - 316 - 8 - 12 = 464 > height 100, so no flip.
    // top = 316 + 8 = 324. center = 120. left = clamp(120 - 160, 12, 948) = 12.
    // arrowLeft = clamp(120 - 12, 14, 306) = 108.
    expect(
      computeBubblePosition(
        { left: 100, right: 140, top: 300, bottom: 316 },
        { width: 320, height: 100 },
        { width: 1280, height: 800 },
      ),
    ).toEqual({ left: 12, top: 324, arrowLeft: 108, above: false });
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
    ).toEqual({ left: 465, top: 572, arrowLeft: 160, above: true });
  });

  it("stays below when it fits nowhere, pinned so the definition starts on screen", () => {
    // roomBelow = 400 - 196 - 20 = 184; roomAbove = 180 - 20 = 160.
    // Height 300 exceeds both, and flipping would be worse, so it stays below —
    // but 196 + 8 = 204 would hang 116px off the bottom, so the vertical clamp
    // pulls it to 400 - 300 - 12 = 88, putting the whole bubble on screen.
    const p = computeBubblePosition(
      { left: 100, right: 140, top: 180, bottom: 196 },
      { width: 320, height: 300 },
      { width: 1280, height: 400 },
    );
    expect(p.above).toBe(false);
    expect(p.top).toBe(88);
    expect(p.top + 300).toBeLessThanOrEqual(400 - 12);
  });

  it("prefers a roomier flip over clamping (a low word on a tall window)", () => {
    // roomBelow = 800 - 700 - 20 = 80 < height 100, and roomAbove = 664 is far
    // roomier, so it flips rather than being squeezed: 684 - 8 - 100 = 576.
    const p = computeBubblePosition(
      { left: 100, right: 140, top: 684, bottom: 700 },
      { width: 320, height: 100 },
      { width: 1280, height: 800 },
    );
    expect(p.above).toBe(true);
    expect(p.top).toBe(576);
  });

  it("clamps the bottom edge when neither side fits and above is tighter", () => {
    // A tall definition on a short window, word near the top:
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

  it("keeps a phone-width bubble on screen, arrow still tracking the word", () => {
    // A word near the right edge at 375px: left clamps to 375 - 320 - 12 = 43,
    // and the arrow shifts to 345 - 43 = 302 so it still points at the word.
    expect(
      computeBubblePosition(
        { left: 330, right: 360, top: 100, bottom: 116 },
        { width: 320, height: 90 },
        { width: 375, height: 667 },
      ),
    ).toEqual({ left: 43, top: 124, arrowLeft: 302, above: false });
  });

  it("holds the arrow inside the rounded corners", () => {
    // center - left = 3, below the 14px inset, so the arrow is pushed in.
    const p = computeBubblePosition(
      { left: 10, right: 20, top: 50, bottom: 66 },
      { width: 276, height: 80 },
      { width: 300, height: 500 },
    );
    expect(p.left).toBe(12);
    expect(p.arrowLeft).toBe(14);
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
});
