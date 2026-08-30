# Rulings

Full text of decisions made under the Conduct escalation protocol, kept as
separate files because the `TASKS.md` build log records a *summary* of each
ruling and a summary is not the artifact.

**Why this directory exists.** The 31 July 2026 audit filed `A-01`: the only
ruling ever made under the adopted protocol existed solely in a session
scratchpad — a temp directory scheduled for garbage collection — while
`TASKS.md` pointed at that path as if it were durable. A governance record that
evaporates when the session ends is not a record. The audit preserved a copy in
its own `evidence/` folder, which is the only reason the text survived at all.

## What belongs here

The **verbatim ruling text** for any escalated decision whose reasoning is longer
than its build-log summary can carry: the question, the options, both phases'
recommendations where the protocol was two-phase, the conditions attached, and
what would justify revisiting it.

The build log stays the index. Each entry summarises the decision and links here;
this directory holds what the summary compresses.

## Rules

1. **Ruling files are records, not documents.** Once written they are not edited
   to reflect later events. If a ruling is superseded, write a new file and note
   the supersession in `TASKS.md` — do not rewrite history in place.
2. **Copy verbatim.** `pool-basis.md` is a byte-identical copy of the audit's
   preserved artifact (17,582 bytes; verified with `cmp`). Provenance notes go in
   this README or the ledger, never inside the ruling text.
3. **Never cite a scratchpad path as the home of a durable artifact.** That is the
   defect this directory closes. If work produced something worth citing, move it
   into the repo in the same session that produced it.

## Contents

| File | Decision | Date | Protocol |
|---|---|---|---|
| `pool-basis.md` | May pool-published allocation percentages be curated under a school's name? Ruled **conditional (B)**, with four binding conditions B1–B4. Applied: MIT FY2001/03/04 curated behind an independent-fetch gate; Stanford's gap stands for all years. | 2026-07-30 | Two-phase blind, fresh-context Fable senior. Summary and the article-by-article check are in the `TASKS.md` build log entry of 2026-07-31. |
