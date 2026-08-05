// A single live region for every <Term> on the page, mounted once in the root
// layout (src/components/TermAnnouncer.tsx).
//
// Why it lives at the document root rather than next to the word: accessible
// names are computed from an element's text content, so a live region rendered
// as a sibling of the trigger becomes part of the accessible name of whatever
// contains it. <Term> sits inside an <h2> ("Asset allocation over time") and
// inside a <th> ("Annualized return") — an inline live region turned the open
// definition into part of that heading's and that column header's name, which
// a screen reader then reads for every cell in the column.
//
// It must also be mounted BEFORE the text appears: a live region created in the
// same tick as its content is frequently not announced at all.

let current = "";
const listeners = new Set<() => void>();

export function announceTerm(text: string): void {
  if (text === current) return;
  current = text;
  for (const listener of listeners) listener();
}

export function subscribeTermAnnouncement(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTermAnnouncement(): string {
  return current;
}

/** Server render never has an announcement pending. */
export function getServerTermAnnouncement(): string {
  return "";
}
