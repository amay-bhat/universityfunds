"use client";

import { useSyncExternalStore } from "react";
import {
  getServerTermAnnouncement,
  getTermAnnouncement,
  subscribeTermAnnouncement,
} from "@/lib/term-announce";

/**
 * The one live region that speaks <Term> definitions. Mounted once, in the root
 * layout, so it is always present before any text arrives and never lands
 * inside a heading or table header where it would corrupt the accessible name.
 */
export function TermAnnouncer() {
  const text = useSyncExternalStore(
    subscribeTermAnnouncement,
    getTermAnnouncement,
    getServerTermAnnouncement,
  );
  return (
    <div role="status" className="sr-only">
      {text}
    </div>
  );
}
