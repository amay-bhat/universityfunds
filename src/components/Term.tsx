"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY, type GlossaryTerm } from "@/lib/glossary";
import {
  bubbleWidth,
  computeBubblePosition,
  isTriggerOffscreen,
  type BubblePlacement,
} from "@/lib/bubble-position";

// First-use definition affordance for finance terms (PRD rule 3). A real
// <button> so keyboard and touch both work; clicking floats the definition in a
// bubble beside the word rather than pushing the paragraph apart.
//
// Accessibility notes, because this pattern is easy to get wrong:
//   - The bubble is a TOGGLETIP, not a tooltip: it opens on click (not hover),
//     so it must not rely on hover or steal focus. Focus stays on the word.
//   - The visible bubble is aria-hidden and the definition is announced through
//     a persistent live region instead. A live region that already exists in the
//     DOM announces reliably; one created at the same moment as its text often
//     does not. Screen-reader users therefore hear the definition once, not
//     twice, and never have to chase a floating element in the reading order.
//   - The bubble holds text only. Interactive content inside a toggletip would
//     need focus management and a focus trap; the full glossary is one nav click
//     away instead (/glossary).
//
// useLayoutEffect would warn during server rendering, so alias it to useEffect
// there. The choice is constant per environment, so hook order is stable.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Only one bubble is open at a time, so a page never fills with stacked
// bubbles. Module-scoped rather than React context: <Term> appears in a dozen
// unrelated server-rendered trees that share no provider.
let closeOpenBubble: (() => void) | null = null;

export function Term({
  t,
  children,
}: {
  t: GlossaryTerm;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<BubblePlacement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Opening this bubble closes any other.
  useEffect(() => {
    if (!open) return;
    closeOpenBubble?.();
    closeOpenBubble = close;
    return () => {
      if (closeOpenBubble === close) closeOpenBubble = null;
    };
  }, [open, close]);

  // Measure and place. Scroll is captured (third argument) so scrolling the
  // table a word sits inside keeps the bubble attached to it, not just page
  // scroll. Repositioning is coalesced to one frame: scroll fires far more often
  // than the screen repaints, and each raw event would otherwise re-render.
  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
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
      setPlacement(
        computeBubblePosition(
          trigger,
          { width: bubble.offsetWidth, height: bubble.offsetHeight },
          viewport,
        ),
      );
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
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open, close]);

  // Escape and click-away dismissal.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (e: Event) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || bubbleRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, close]);

  const definition = GLOSSARY[t];
  const width = open && typeof window !== "undefined" ? bubbleWidth(window.innerWidth) : undefined;

  return (
    <span className="inline">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline cursor-help border-b border-dotted border-current bg-transparent p-0 text-left font-inherit text-inherit hover:border-solid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        title={open ? undefined : "What does this mean?"}
      >
        {children ?? t}
        <span aria-hidden="true" className="select-none text-sky-700 dark:text-sky-400">
          °
        </span>
      </button>

      {/* Persistent live region: the definition is spoken from here. */}
      <span role="status" className="sr-only">
        {open ? `${t}: ${definition}` : ""}
      </span>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            ref={bubbleRef}
            aria-hidden="true"
            className="fixed z-[60] block rounded-lg bg-white p-3 text-left text-sm leading-snug text-zinc-700 shadow-xl ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/15"
            style={{
              width,
              left: placement?.left ?? 0,
              top: placement?.top ?? 0,
              // Hidden until measured — a layout effect sets the position
              // before the browser paints, so this never flashes.
              visibility: placement ? "visible" : "hidden",
            }}
          >
            <span
              aria-hidden="true"
              className="absolute h-2 w-3 bg-white dark:bg-zinc-900"
              style={{
                left: (placement?.arrowLeft ?? 0) - 6,
                [placement?.above ? "bottom" : "top"]: -7,
                clipPath: placement?.above
                  ? "polygon(0 0, 100% 0, 50% 100%)"
                  : "polygon(50% 0, 100% 100%, 0 100%)",
              }}
            />
            <span className="block font-semibold text-zinc-900 dark:text-zinc-100">{t}</span>
            <span className="mt-0.5 block">{definition}</span>
          </span>,
          document.body,
        )}
    </span>
  );
}
