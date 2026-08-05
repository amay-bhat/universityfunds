"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY, type GlossaryTerm } from "@/lib/glossary";
import { announceTerm } from "@/lib/term-announce";
import {
  bubbleMaxHeight,
  bubbleWidth,
  computeBubblePosition,
  isTriggerOffscreen,
} from "@/lib/bubble-position";

// First-use definition affordance for finance terms (PRD rule 3). A real
// <button> so keyboard and touch both work; clicking floats the definition in a
// bubble beside the word rather than pushing the paragraph apart.
//
// The pattern is a TOGGLETIP, not a tooltip: it opens on click (never hover), so
// it must not rely on hover and must not steal focus. Notes on the parts that
// are easy to get wrong:
//
//   - The bubble is inert. `pointer-events: none` means it never swallows a tap
//     meant for whatever it covers — on a phone an open bubble otherwise sits on
//     top of neighbouring terms and links and kills them until dismissed — and a
//     tap "through" it dismisses it. The one exception is when a definition is
//     too tall for the viewport and has to scroll inside the bubble.
//   - The definition is announced through one shared live region mounted in the
//     root layout, never a sibling of the word: a live region next to the
//     trigger becomes part of the accessible name of the <h2> or <th> the word
//     sits in. See src/lib/term-announce.ts.
//   - The bubble holds text only. Interactive content in a toggletip would need
//     a focus trap; the full glossary is one nav click away instead.
//
// useLayoutEffect would warn during server rendering, so alias it to useEffect
// there. The choice is constant per environment, so hook order is stable.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Only one bubble is open at a time, so a page never fills with stacked
// bubbles. Module-scoped rather than React context: <Term> appears in a dozen
// unrelated server-rendered trees that share no provider.
let closeOpenBubble: (() => void) | null = null;

type Box = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  /** The definition is taller than the viewport allows and scrolls internally. */
  scrollable: boolean;
};

const same = (a: Box | null, b: Box) =>
  a !== null &&
  a.left === b.left &&
  a.top === b.top &&
  a.width === b.width &&
  a.maxHeight === b.maxHeight &&
  a.scrollable === b.scrollable;

export function Term({
  t,
  children,
}: {
  t: GlossaryTerm;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const scrollableRef = useRef(false);

  const close = useCallback(() => setOpen(false), []);
  const definition = GLOSSARY[t];

  // Opening this bubble closes any other, and hands the definition to the
  // shared live region.
  useEffect(() => {
    if (!open) return;
    closeOpenBubble?.();
    closeOpenBubble = close;
    announceTerm(`${t}: ${definition}`);
    return () => {
      if (closeOpenBubble === close) closeOpenBubble = null;
      announceTerm("");
    };
  }, [open, close, t, definition]);

  // Measure and place. Width and max-height are applied to the element BEFORE
  // measuring so the numbers fed to the geometry always describe the box as it
  // will actually be laid out — deriving width during render instead meant a
  // resize measured the previous render's box and positioned for the wrong one.
  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setBox(null);
      scrollableRef.current = false;
      return;
    }
    let frame = 0;
    const place = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const bubble = bubbleRef.current;
      if (!trigger || !bubble) return;
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      // The word has scrolled away; the bubble would be orphaned.
      if (isTriggerOffscreen(trigger, viewport)) {
        close();
        return;
      }
      const width = bubbleWidth(viewport.width);
      const maxHeight = bubbleMaxHeight(viewport.height);
      bubble.style.width = `${width}px`;
      bubble.style.maxHeight = `${maxHeight}px`;
      const scrollable = bubble.scrollHeight > bubble.clientHeight + 1;
      const { left, top } = computeBubblePosition(
        trigger,
        { width, height: bubble.offsetHeight },
        viewport,
      );
      const next: Box = { left, top, width, maxHeight, scrollable };
      scrollableRef.current = scrollable;
      setBox((prev) => (same(prev, next) ? prev : next));
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        place();
      });
    };
    place();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    // Catches reflow that is neither a scroll nor a window resize — a chart
    // re-rendering, a font loading, a details panel opening above the word —
    // which would otherwise strand the bubble at a stale position.
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open, close]);

  // Escape and click-away dismissal. Escape only closes: focus has not left the
  // word (blur closes the bubble), so moving it would mean stealing focus from
  // wherever the user actually is.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointerDown = (e: Event) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      // A scrolling bubble is the only one that accepts pointer events, and
      // dragging its scrollbar must not dismiss it.
      if (scrollableRef.current && bubbleRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, close]);

  return (
    <span className="inline">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        // Tabbing away from the word closes the bubble, so it can never sit on
        // top of the control the user just moved to.
        onBlur={close}
        className="inline cursor-help border-b border-dotted border-current bg-transparent p-0 text-left text-inherit hover:border-solid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        title={open ? undefined : "What does this mean?"}
      >
        {children ?? t}
        <span aria-hidden="true" className="select-none text-sky-700 dark:text-sky-400">
          °
        </span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            ref={bubbleRef}
            aria-hidden="true"
            // forced-colors: the ring and shadow are both box-shadow, which
            // High Contrast mode strips, leaving the bubble with no edge at all
            // over the text it covers — so it gets a real border there.
            className={`fixed z-[60] block overflow-y-auto rounded-lg bg-white p-3 text-left text-sm leading-snug text-zinc-700 shadow-xl ring-1 ring-zinc-900/10 print:hidden forced-colors:border forced-colors:border-[CanvasText] dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/15 ${
              box?.scrollable ? "pointer-events-auto" : "pointer-events-none"
            }`}
            // Clicking a scrolling bubble must not blur the word (which would
            // close it); preventing mousedown's default keeps focus put.
            onMouseDown={(e) => e.preventDefault()}
            style={{
              width: box?.width,
              maxHeight: box?.maxHeight,
              left: box?.left ?? 0,
              top: box?.top ?? 0,
              // Hidden until measured — a layout effect sets the position
              // before the browser paints, so this never flashes.
              visibility: box ? "visible" : "hidden",
            }}
          >
            <span className="block font-semibold text-zinc-900 dark:text-zinc-100">{t}</span>
            <span className="mt-0.5 block">{definition}</span>
          </span>,
          document.body,
        )}
    </span>
  );
}
