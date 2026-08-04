# WP5 — Close the validator coverage gap — code, not prose

1 work order. Part of the [31 July 2026 audit](README.md) — read section 0 there first.

**Why this package exists**

The only findings that touch executable code. Neither changes validator *behaviour*: one makes an existing test discriminating, the other adds the negative cases whose absence four documents currently misdescribe. The validator itself is correct — it is the claim about its test coverage that is false.

---

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-34` | medium | `scripts/verify-seed-validator.ts` | 166 | verify case 13 is vacuous — it passes with the rule it names deleted |

---

### A-34 · verify case 13 is vacuous — it passes with the rule it names deleted

| | |
|---|---|
| **Severity** | medium |
| **Location** | `scripts/verify-seed-validator.ts:166` |
| **Found by** | 1 independent auditor — `validator` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
165:   {
166:     name: "endowment return row with a citation and no number",
167:     break: (dir) =>
```

**What is wrong**

scripts/verify-seed-validator.ts:165-174 — case 13 ("endowment return row with a citation and no number") does not discriminate the rule it names. Its sole assertion is the bare substring `expectError: "a citation with no number"`, which occurs in three different validator messages (scripts/lib/seed-validate.ts:887, 906, 920). Its mutation deletes both figures from Yale's endowmentReturns[0], a row that carries both `returnSourceId` and `marketValueSourceId`, so with the target rule at scripts/lib/seed-validate.ts:884-890 deleted the input instead trips the 906 and 920 checks, the substring still matches, and the suite still reports "30/30 validator checks passed."

That matters because 884-890 is the only guard against a row carrying `fiscalYear` and nothing else: `optionalString` returns null for an absent key (line 327) while `optionalNumber` returns undefined (line 364), so all four pairing checks at 896/903/910/917 are inert for such a row. Verified empirically — appending `{"fiscalYear": 1999}` to Yale's endowmentReturns yields 1 error and rejection under the committed validator, but 0 errors under the mutant, which admits an all-NULL row: {"schoolId":"yale","fiscalYear":1999,"returnPct":null,"marketValueUsdMillions":null,"returnSourceId":null,"marketValueSourceId":null}.

The rule itself is correct and live at HEAD, so no published figure is affected and the build is unaffected; the defect is that the rule is unprotected by its own regression test, while TASKS.md:195 lists "a row with a citation and no number" among holes closed "each with a `seed:verify` case."

Additionally (not in the original finding): the sibling check at 903-909 is also unpinned — deleting it alone, with 884-890 intact, still yields 30/30, because no case removes `returnPct` on its own. Root cause is the harness contract at lines 319-327: `expectError` is a substring match over the concatenation of `where: message` for every error, with no assertion on the error count, the `where`, or which check fired. Four expected substrings are shared across multiple messages ('a citation with no number' x3, 'outside the plausible range' x3, 'looks like fractions' x2, 'duplicate row for FY' x2). Fix: assert on the full message (as cases 28 and 29 at lines 283 and 288 already do) and/or on the expected error count, and add a dedicated case for a `fiscalYear`-only row and for a `returnPct`-only deletion.

Not documented as accepted debt anywhere: no mention in TASKS.md, CONSTITUTION.md, data/README.md, CLAUDE.md, PRD.md, or the STRUCTURE.md:168-185 "Structural notes worth carrying" list.

**Evidence as filed**

```text
scripts/verify-seed-validator.ts:165-174 —
  {
    name: "endowment return row with a citation and no number",
    break: (dir) =>
      editYale(dir, (y) => {
        const row = returnsOf(y)[0];
        delete row.returnPct;
        delete row.marketValueUsdMillions;
      }),
    expectError: "a citation with no number",
  },

With seed-validate.ts:884-890 silenced, re-running exactly that mutation (scratchpad case13.ts) gives:
  errors: 2
    ERR schools/yale.json endowmentReturns[0]: `returnSourceId` is present but `returnPct` is missing — a citation with no number. Delete it, or add the figure it cites
    ERR schools/yale.json endowmentReturns[0]: `marketValueSourceId` is present but `marketValueUsdMillions` is missing — a citation with no number. Delete it, or add the figure it cites
  case-13 assertion 'a citation with no number' satisfied? true
and the full suite still reports "30/30 validator checks passed."
```

**Independent reproduction by the refuting auditor**

```text
PATH CORRECTION FIRST — `wc -l scripts/seed-validate.ts` => "No such file or directory". Real path is /Users/amayb/Projects/dashboardProject/scripts/lib/seed-validate.ts (44630 bytes).

REPO IS CLEAN, so all of the below is against committed HEAD=00a08ec:
  $ git status --porcelain scripts/ ; git diff --stat HEAD -- scripts/
  (both empty)

VERBATIM CASE 13, sed -n '165,174p' scripts/verify-seed-validator.ts:
  {
    name: "endowment return row with a citation and no number",
    break: (dir) =>
      editYale(dir, (y) => {
        const row = returnsOf(y)[0];
        delete row.returnPct;
        delete row.marketValueUsdMillions;
      }),
    expectError: "a citation with no number",
  },

SUBSTRING COUNT, $ grep -n "a citation with no number" scripts/lib/seed-validate.ts:
  887:  "row has neither `returnPct` nor `marketValueUsdMillions` — a citation with no number. Delete the row, or add the figure it cites",
  906:  "`returnSourceId` is present but `returnPct` is missing — a citation with no number. Delete it, or add the figure it cites",
  920:  "`marketValueSourceId` is present but `marketValueUsdMillions` is missing — a citation with no number. Delete it, or add the figure it cites",
=> exactly 3, at exactly the cited lines.

HARNESS CONTRACT, scripts/verify-seed-validator.ts:315-326 — errors are flattened to `${e.where}: ${e.message}` and matched with `errors.some((line) => line.includes(testCase.expectError!))`. […]
```

**Why it matters** — The one rule that stops an all-NULL endowment_returns row (fiscalYear only, no figures, no citations) from being inserted is unprotected by its own regression test. Root cause is the harness design: `expectError` is a bare substring match against the concatenation of every error, with no assertion on `where`, on the error count, or on which check fired — so any case whose expected substring is shared by a neighbouring message is at risk.

**Fix**

Make the assertion discriminating: match on the unique prefix "row has neither `returnPct` nor `marketValueUsdMillions`", and strengthen the harness to assert `where` plus the expected error count (as case 27 at line 278 already does with its "sources.json[2]:" prefix) so a coincidental message from another check cannot satisfy a case.

**Verify**

```bash
npm run seed:verify   # 30/30 before and after the fix
# then prove it discriminates: comment out seed-validate.ts:884-890 and re-run — it must now FAIL
```

---
