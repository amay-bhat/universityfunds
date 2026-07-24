# CLAUDE.md — University Endowment Investing Explorer

Free, public, no-login web app showing everyday DIY investors how famous university endowments (Yale, Harvard, Stanford, MIT, Princeton) invested over the decades, what a buy-it-yourself ETF version looks like, and how it compares to simple index investing. **Education, not financial advice.**

## Read these first, in order

1. `CONSTITUTION.md` — how decisions get made when the human isn't in the room. The Articles you must not break, the decisions reserved for the human, and the escalation procedure to use **instead of stopping** when you have a question.
2. `PRD.md` — what we're building, the non-negotiable rules, definition of done.
3. `TASKS.md` — the task checklist. Pick the first unchecked task, do only it, check it off, log notes.
4. `plan.html` — human-readable overview (context only; PRD wins on conflicts).

## Workflow (important)

- This project uses a **docs-conduct workflow**: no conversation history carries between sessions. These files are the only memory. Keep them true: check off finished tasks, append to the Build log in `TASKS.md`.
- One task per session (unless trivially small).
- **Don't stop to ask a question — escalate it.** Answer it yourself first (options, recommendation, reasoning), then spawn a subagent one model tier up (Sonnet → Opus → Fable) for an independent answer. If that answer breaks no Article, treat it as the human's decision and keep working. Stop for the human only when the answer would break an Article, or the decision is reserved by `CONSTITUTION.md` Part 2. Full procedure in `CONSTITUTION.md` Part 3; log every proxied decision per Part 4.
- If genuinely blocked (no answer available at any tier, or a Part 2 decision), write the blocker in the Build log and stop.
- Tasks marked `[H]` are for the human (Vercel dashboard etc.) — skip them and tell the user.
- Checkpoints in `TASKS.md` mean: stop, tell the user to switch to Fable for review. Checkpoints are **not** escalatable — they are human review gates, not questions, so the escalation procedure doesn't route around them.

## Stack

- Next.js (App Router, TypeScript, Tailwind) on Vercel (Pro). Prefer Vercel-native components/integrations.
- Neon Postgres via Vercel's native integration; connection string in `.env.local` (gitignored) via `vercel env pull`.
- Hand-curated seed data in `data/` is the **source of truth**; `npm run seed` loads it into Neon. Never edit the DB directly — edit seed files and re-seed.
- Repo: https://github.com/amaybhat-creator/universityfunds — pushing to main auto-deploys.

## Non-negotiable rules (from PRD — enforce in every task)

1. Never produce copy that tells a user what to do with their money. No personalization.
2. Every data point in `data/` has a citation (source_id → `sources`). No citation, no number.
3. Plain English everywhere; define any finance term on first use.
4. Honest numbers even when unflattering to endowments.
5. Read the **dataviz skill** before writing any chart code.
6. Financial math (backtest engine) requires unit tests with hand-computed expected values.

## Domain notes

- Endowment fiscal years end **June 30** (FY2025 = July 2024–June 2025). All return series align to fiscal years, not calendar years.
- Allocation categories are normalized across schools (schools use different labels — map them during curation and note the mapping in `data/README.md`).
- Copycat/backtest math: annual rebalancing, no taxes/fees modeled — say so in the fine print.
