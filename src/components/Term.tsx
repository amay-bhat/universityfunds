"use client";

import { useId, useState } from "react";
import { GLOSSARY, type GlossaryTerm } from "@/lib/glossary";

// First-use definition affordance for finance terms (PRD rule 3). A real
// <button> so keyboard and touch both work; the definition is revealed inline
// (no floating tooltip to clip on phones) and is programmatically associated
// via aria-controls/aria-expanded.
export function Term({
  t,
  children,
}: {
  t: GlossaryTerm;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="inline">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline cursor-help border-b border-dotted border-current bg-transparent p-0 text-left font-inherit text-inherit hover:border-solid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        title={open ? undefined : "What does this mean?"}
      >
        {children ?? t}
        <span aria-hidden="true" className="select-none text-sky-700 dark:text-sky-400">
          °
        </span>
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className="mx-1 inline rounded bg-sky-50 px-1.5 py-0.5 text-sm text-sky-950 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-800"
        >
          {GLOSSARY[t]}
        </span>
      )}
    </span>
  );
}
