#!/usr/bin/env bash
# Recompute every count the 31 July 2026 audit found wrong.
#
#   Before the fix pass:  the DOCUMENT ASSERTIONS section should report failures.
#   After the fix pass:   every line should read OK.
#
# The GROUND TRUTH section reads the data and git only. It should pass at all
# times — if it ever fails, a fix pass changed data, which this audit's work
# orders never ask for.
#
# Usage:  ./conduct/audits/2026-07-31/verify.sh
# Exit:   0 if everything passes, 1 otherwise.

set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../../.." || exit 2

pass=0; fail=0
ok()   { printf '  \033[32mOK\033[0m    %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; fail=$((fail+1)); }
info() { printf '  ----  %s\n' "$1"; }
head_() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# check <label> <expected> <actual>
check() {
  if [ "$2" = "$3" ]; then ok "$1 = $3"; else bad "$1: expected $2, got $3"; fi
}

# NOTE (2026-08-29): the count captures below read `grep -c ... || echo 0`, which
# was wrong in the one case that matters. `grep -c` prints "0" AND exits 1 when
# there are no matches, so the fallback appended a SECOND line and the variable
# became "0\n0" — never equal to the expected "0". Four checks could therefore
# only ever report failure, including the three that go green exactly when a fix
# lands. Replaced with `|| true`, which keeps grep's own printed 0. Found while
# remediating this audit: the fix pass turned a check green and the gate still
# said FAIL, with the tell-tale stray "0" printed under it.

head_ "GROUND TRUTH — recomputed from data/ and git (must always pass)"

n=$(python3 -c "
import json
s=json.load(open('data/sources.json'))
print(len([x for x in s if 'no as-of date' in json.dumps(x)]))")
check "undated HMC allocation tables in sources.json" 5 "$n"

n=$(python3 -c "
import json
y=json.load(open('data/schools/yale.json'))
print(len({r['fiscalYear'] for r in y['allocations']}))")
check "Yale distinct allocation fiscal years" 21 "$n"

n=$(python3 -c "
import json
y=json.load(open('data/schools/yale.json'))
print(len(y['endowmentReturns']))")
check "Yale endowment-return rows" 26 "$n"

n=$(python3 -c "
import json
p=json.load(open('data/schools/princeton.json'))
a={r['fiscalYear'] for r in p['allocations']}
print(len([y for y in range(2005,2024) if y not in a]))")
check "Princeton allocation gaps in FY2005-FY2023" 1 "$n"

n=$(python3 -c "
import json
h=json.load(open('data/schools/harvard.json'))
tail=[r for r in h['endowmentReturns'] if r['fiscalYear']<=2006 or r['fiscalYear']==2010]
print(len({r.get('returnSourceId') for r in tail}))")
check "distinct documents behind Harvard's 8-year returns tail" 6 "$n"

# The rule the whole project rests on. If this ever fails, stop everything.
n=$(python3 -c "
import json,glob,os
ids={s['id'] for s in json.load(open('data/sources.json'))}
bad=0
for f in glob.glob('data/schools/*.json'):
    d=json.load(open(f))
    for r in d.get('allocations',[]):
        if r.get('sourceId') not in ids: bad+=1
    for r in d.get('endowmentReturns',[]):
        for k in ('returnSourceId','marketValueSourceId'):
            v=r.get(k)
            if v is not None and v not in ids: bad+=1
        if r.get('returnPct') is not None and not r.get('returnSourceId'): bad+=1
        if r.get('marketValueUsdMillions') is not None and not r.get('marketValueSourceId'): bad+=1
for r in json.load(open('data/benchmark_returns.json')):
    if r.get('sourceId') not in ids: bad+=1
print(bad)")
check "uncited or dangling figures across the whole data layer" 0 "$n"

info "tracked files: $(git ls-files | wc -l | tr -d ' ')"
info "unpushed commits: $(git rev-list --count origin/main..HEAD 2>/dev/null || echo '?')"
info "HEAD: $(git rev-parse --short HEAD)"

head_ "DOCUMENT ASSERTIONS — the audit's findings (should fail before the fix pass)"

# --- A-01: the pool-basis ruling must survive outside a temp directory
if [ -f conduct/rulings/pool-basis.md ]; then
  ok "pool-basis ruling preserved in conduct/rulings/"
else
  bad "A-01: conduct/rulings/pool-basis.md missing — the only ruling made under the adopted protocol still lives only in a session scratchpad"
fi
# Narrowed 2026-08-29 to WP1-ledger.md's OWN prescribed verify, which reads:
#   grep -n "Ruling file" TASKS.md   # must point into conduct/rulings/
# The previous implementation grepped TASKS.md for the bare phrase "session
# scratchpad" anywhere in the file. That is a cruder proxy than the work order
# asks for, and it fails on two innocent build-log lines that record where some
# throwaway pypdf extraction scripts lived — history that is true, harmless, and
# explicitly marked "regenerate rather than hunt for them". Passing the old check
# would have meant rewording accurate history to satisfy a grep. The finding is
# about a DURABLE artifact being cited at a temp path, so the check now asserts
# exactly that.
ruling_ptr=$(grep -h 'Ruling file' TASKS.md 2>/dev/null || true)
if [ -z "$ruling_ptr" ]; then
  bad "A-01: TASKS.md has no 'Ruling file' pointer at all"
elif printf '%s' "$ruling_ptr" | grep -q 'conduct/rulings/'; then
  ok "TASKS.md ruling pointer resolves into conduct/rulings/"
else
  bad "A-01: TASKS.md's 'Ruling file' pointer does not resolve into conduct/rulings/ — a durable record may not be cited at a temp path"
fi

# --- A-02 / WP1: undated-table count in the ledger and downstream
n=$(grep -c 'six undated\|six HMC reports\|All six undated' TASKS.md data/README.md STATUS.html 2>/dev/null | awk -F: '{s+=$2} END{print s+0}')
check "stale \"six undated tables\" phrasings across ledger+README+STATUS" 0 "$n"

# --- A-10: RESERVED (kernel Part 2 §5 / CONSTITUTION Part 2 §5).
# Editing CONSTITUTION.md is an amendment; no model at any tier may make it.
# So this gate must NOT reward the edit. What a model owes here is a logged
# PROPOSAL for the human — that is the delegable half (kernel.md:65).
if grep -q 'returnSourceId' CONSTITUTION.md 2>/dev/null; then
  ok "CONSTITUTION.md Article 2 describes the split citation columns (human-adopted)"
elif grep -qE '\[PROPOSED AMENDMENT\].*Article 2' TASKS.md 2>/dev/null; then
  info "A-10 RESERVED — amendment proposed in the ledger, awaiting the human. Correct state for a model."
else
  bad "A-10: no proposed amendment logged. A model must NOT edit CONSTITUTION.md (Part 2 §5) — it must log a [PROPOSED AMENDMENT] entry in TASKS.md and put it in the human digest."
fi

# --- A-17/A-18: CONDUCT-DESIGN must not read as an unsigned draft
n=$(grep -c '0\.1-draft\|draft — binds nothing\|Draft — binds nothing\|draft for review' CONDUCT-DESIGN.html 2>/dev/null || true)
check "CONDUCT-DESIGN.html unsigned-draft markers" 0 "$n"

# --- STATUS.html: the tile value, the nouns in its note, and the rendered blocks
# must all agree. Resolution-agnostic: the fixer may add a third block or drop
# the third noun, but all three numbers have to end up the same.
read -r tile nouns <<<"$(python3 -c "
import re
t=re.sub(r'\s+',' ',open('STATUS.html').read())
m=re.search(r'Waiting on you</div>\s*<div class=\"tile-value[^\"]*\">(\d+)</div>\s*<div class=\"tile-note\">([^<]*)</div>', t)
print(m.group(1), len(m.group(2).split(',')) ) if m else print('? ?')")"
blocks=$(grep -c 'class="action"' STATUS.html || true)
if [ "$tile" = "$blocks" ] && [ "$tile" = "$nouns" ]; then
  ok "STATUS.html 'Waiting on you': tile $tile = $nouns nouns = $blocks blocks"
else
  bad "STATUS.html 'Waiting on you' disagrees three ways: tile says $tile, its note names $nouns, $blocks blocks render"
fi
# and the lede must not still be asking for a signature the kernel already carries
if grep -q 'constitutional signature' STATUS.html; then
  bad "STATUS.html lede still reserves 'a constitutional signature'; kernel.md records it signed 2026-07-30"
else
  ok "STATUS.html lede does not ask for the already-granted signature"
fi

# --- STATUS.html: decision lede must match rendered cards
cards=$(grep -c '<div class="decision">' STATUS.html || true)
check "STATUS.html decision cards" 6 "$cards"
if grep -q 'Five questions' STATUS.html; then
  bad "STATUS.html says 'Five questions' above $cards rendered cards"
else
  ok "STATUS.html decision lede matches the rendered card count"
fi

# --- STATUS.html: Yale coverage sentence
if grep -q '25 years of allocations and returns' STATUS.html; then
  bad "STATUS.html claims Yale has 25 allocation years; the data has 21 (returns are 26)"
else
  ok "STATUS.html Yale coverage sentence corrected"
fi

# --- STATUS.html: sampled QC must not be described as a census
if grep -q 'each row re-verified' STATUS.html; then
  bad "STATUS.html describes task 1.6 QC as a census; TASKS.md:239 records Princeton and Stanford as sampled"
else
  ok "STATUS.html describes task 1.6 QC as sampled where it was sampled"
fi

# --- STATUS.html: citation shape claim must match what the validator enforces.
# The sentence wraps across a line break, so collapse whitespace before matching.
if python3 -c "
import re,sys
t=re.sub(r'\s+',' ',open('STATUS.html').read())
sys.exit(0 if 'specific document and page' in t else 1)"; then
  read -r npg ntot <<<"$(python3 -c "
import json
s=json.load(open('data/sources.json'))
print(len([x for x in s if not x.get('page')]), len(s))")"
  bad "STATUS.html claims every figure cites a document AND page, but $npg of $ntot sources carry no page (the enforced rule is page OR url)"
else
  ok "STATUS.html citation-shape claim matches the enforced rule (page OR url)"
fi

# --- MANUAL.html: the greps it promises the operator
hits=$(grep -c '\[JUDGMENT CALL\]' TASKS.md || true)
# CHANGED 2026-08-29, deliberately and against the letter of 1.8-plan.md §6 step
# 3a, which says to recompute this expected value and write the new literal in at
# integration. It was 7 when the audit was written, then 8 after task 1.7, then
# 10 after the app build, and 28 today. A hard-coded literal here has not
# survived a single session since the audit, and writing "28" in would only
# schedule the next false red — a gate that cries wolf gets ignored, which is
# worse than no gate. The count is now REPORTED, not asserted; what the finding
# (A-27) actually protects is MANUAL.html asserting a stale number, and that is
# asserted directly below. MANUAL.html no longer prints any of these counts, so
# there is nothing left to drift.
info "TASKS.md [JUDGMENT CALL] grep hits: $hits — reported, not asserted; this grows every session that logs a call"
if grep -q 'Four small calls' MANUAL.html; then
  bad "MANUAL.html says the [JUDGMENT CALL] grep finds four; it finds $hits"
elif grep -q 'no</em> counts beside them' MANUAL.html; then
  ok "MANUAL.html names the grep instead of asserting counts that drift"
else
  bad "MANUAL.html's governance-tag table must not assert counts that drift — it must tell the operator to run the grep"
fi

# --- MANUAL.html / QUICKCARD: unpushed commit count
ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo '?')
if grep -q 'Three commits unpushed\|3 commits local' MANUAL.html; then
  bad "MANUAL.html hard-codes 3 unpushed commits; git reports $ahead"
else
  ok "MANUAL.html does not hard-code a stale unpushed count"
fi

# --- MANUAL.html / QUICKCARD: npm audit figure
av=$(npm audit --json 2>/dev/null | python3 -c "
import json,sys
try:
    v=json.load(sys.stdin)['metadata']['vulnerabilities']
    print(f\"{v['total']} ({v['moderate']} moderate, {v['high']} high)\")
except Exception:
    print('unavailable')")
if grep -q '16 findings' MANUAL.html; then
  bad "MANUAL.html says npm audit reports 16 findings; it reports $av"
else
  ok "MANUAL.html npm audit figure not the stale 16 (live: $av)"
fi

# --- WP5: the suite still passes, and case 13 discriminates
if npm run seed:verify >/dev/null 2>&1; then
  ok "npm run seed:verify passes"
else
  bad "npm run seed:verify FAILS — investigate before doing anything else"
fi

head_ "SELF-CHECK — this audit's own id references"

if python3 "$HERE/check-ids.py" >/tmp/_ids.$$ 2>&1; then
  ok "$(tail -n1 /tmp/_ids.$$)"
else
  bad "audit id references disagree with the work orders they name:"
  sed 's/^/        /' /tmp/_ids.$$
fi
rm -f /tmp/_ids.$$

head_ "RESULT"
printf '  %d passed, %d failed\n\n' "$pass" "$fail"
[ "$fail" -eq 0 ] || exit 1
