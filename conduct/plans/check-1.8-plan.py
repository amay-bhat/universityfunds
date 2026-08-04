#!/usr/bin/env python3
"""Standing check for conduct/plans/1.8-plan.md.

Proves the four properties the framework requires of a decomposition, against
the audit tree rather than against the plan's own prose:

  1. every declared unit count equals the ids actually listed
  2. all 74 audit findings are placed exactly once (assigned or deferred)
  3. sibling units have PROVABLY DISJOINT file ownership
     (task-brief.md:56-58 — "Boundaries are the collision defense")
  4. the plan's stated B-id count matches its own table

Run from anywhere:  python3 conduct/plans/check-1.8-plan.py
Exit 0 if clean, 1 otherwise.

The QA pass found three real disjointness breaches here; this exists so a
fourth cannot land silently.
"""
import re, glob, sys, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
os.chdir(REPO)

AUDIT = 'conduct/audits/2026-07-31'
PLAN = 'conduct/plans/1.8-plan.md'
# Units that produce decisions/proposals, never a write to a target file.
NO_FILE_UNITS = {'1.8.HD (digest)', '1.8.F'}

# ---- authoritative id -> file, parsed from the audit work orders
loc = {}
for f in sorted(glob.glob(f'{AUDIT}/WP*.md')) + [f'{AUDIT}/BACKLOG.md']:
    for blk in re.finditer(r'^### ([AB]-\d+) · .+?$(.*?)(?=^### |\Z)',
                           open(f).read(), re.M | re.S):
        m = re.search(r'\*\*Location\*\* \| `([^`]+)`', blk.group(2))
        if m:
            loc[blk.group(1)] = m.group(1).split(':')[0]

ALL = {f'A-{i:02d}' for i in range(1, 38)} | {f'B-{i:02d}' for i in range(1, 38)}
fails = []
if set(loc) != ALL:
    fails.append(f'audit tree does not define exactly 74 ids: missing {sorted(ALL - set(loc))}')

t = open(PLAN).read()


def expand(s):
    out = set()
    for m in re.finditer(r'([AB])-(\d+)\.\.(?:[AB]-)?(\d+)', s):
        p, a, b = m.group(1), int(m.group(2)), int(m.group(3))
        out |= {f'{p}-{i:02d}' for i in range(a, b + 1)}
    out |= set(re.findall(r'[AB]-\d\d',
                          re.sub(r'([AB])-(\d+)\.\.(?:[AB]-)?(\d+)', '', s)))
    return out


tbl = re.search(r'\| Unit \| Owns \(write scope\) \| Findings \| n \|(.*?)\n\n', t, re.S)
if not tbl:
    print('FAIL: could not find the unit table (did its header change?)')
    sys.exit(1)

assign, dup = {}, []
for row in tbl.group(1).strip().split('\n')[1:]:
    c = [x.strip() for x in row.strip('|').split('|')]
    if len(c) < 4 or 'Deferred' in c[0]:
        continue
    ids, n = expand(c[2]), c[3].replace('**', '')
    if str(len(ids)) != n:
        fails.append(f'{c[0]}: declares n={n} but lists {len(ids)} ids')
    for i in ids:
        if i in assign:
            dup.append(i)
        assign[i] = c[0]

defer_blk = re.search(r'\*\*Deferred to new ledger tasks.*?(?=\*\*Standing)', t, re.S)
defer = expand(defer_blk.group(0)) if defer_blk else set()

if dup:
    fails.append(f'ids assigned to more than one unit: {sorted(set(dup))}')
unplaced = ALL - set(assign) - defer
if unplaced:
    fails.append(f'ids placed nowhere: {sorted(unplaced)}')
both = set(assign) & defer
if both:
    fails.append(f'ids both assigned and deferred: {sorted(both)}')

# ---- 4b. every routed unit must have an ownership row, and vice versa.
# The acceptance gate found 1.8.R absent from §11 while routed in §2; this
# checker could not see it, because it only ever parsed §11. A unit missing
# from the ownership table is invisible to a table-only check, so compare the
# two tables against each other.
route_tbl = re.search(r'\| Unit \| Tier \| Budget \| Deciding property.*?\n(.*?)\n\n', t, re.S)
routed = set(re.findall(r'\*\*(1\.8\.\w+)\*\*', route_tbl.group(1))) if route_tbl else set()
owned = set()
for row in tbl.group(1).strip().split('\n')[1:]:
    owned |= set(re.findall(r'1\.8\.\w+', row.split('|')[1] if '|' in row else row))
if not routed:
    fails.append('sanity: parsed zero routed units from the §2 table — shape changed, check vacuous')
for u in sorted(routed - owned):
    fails.append(f'unit {u} is routed in §2 but has NO ownership row in §11 — its write scope is '
                 f'undeclared and the disjointness proof silently excludes it')
for u in sorted(owned - routed):
    fails.append(f'unit {u} has an ownership row in §11 but is not routed in §2')

# ---- 4c. artifacts the plan depends on must appear in an OWNS COLUMN, not just
# anywhere in the table. The prior version substring-tested the whole table body,
# so moving an artifact name into a Findings cell still passed.
owns_cells = []
for row in tbl.group(1).strip().split('\n')[1:]:
    cells = [c.strip() for c in row.strip('|').split('|')]
    if len(cells) >= 2:
        owns_cells.append(cells[1])
owns_text = ' '.join(owns_cells)
for artifact in ('apply-patches.py', 'verify-remediation.sh', 'check-docs.ts',
                 'DETERMINATIONS.md'):
    if artifact in t and artifact not in owns_text:
        fails.append(f"{artifact} is invoked by the plan but appears in no unit's Owns column")

# ---- the property that matters most
owners = collections.defaultdict(set)
for i, u in assign.items():
    if u not in NO_FILE_UNITS:
        owners[loc.get(i, '?')].add(u)
for f, us in sorted(owners.items()):
    if len(us) > 1:
        detail = '; '.join(
            f'{u}: {" ".join(sorted(i for i in assign if assign[i] == u and loc.get(i) == f))}'
            for u in sorted(us))
        fails.append(f'DISJOINTNESS BREACH — {f} written by {len(us)} units: {detail}')

claim = re.search(r'all (\d+) assigned B-ids', t)
nb = len([i for i in assign if i.startswith('B')])
if claim and claim.group(1) != str(nb):
    fails.append(f'prose says "all {claim.group(1)} assigned B-ids"; the table assigns {nb}')

# ---- 5. no reserved finding may be scheduled as a chain escalation.
# kernel.md:48-52 — "a reserved matter never enters the chain". The QA pass
# caught A-08 double-booked as both a digest ask and [PROXY DECISION] 2.
reserved = set()
sweep = re.search(r'\| Finding \| Site \| Clause \|(.*?)\n\n', t, re.S)
if sweep:
    for row in sweep.group(1).strip().split('\n')[1:]:
        reserved |= set(re.findall(r'[AB]-\d\d', row.split('|')[1] if '|' in row else ''))
proxy = set()
for m in re.finditer(r'\*\*\[PROXY DECISION\] \d+ — ([AB]-\d\d)', t):
    proxy.add(m.group(1))
both = reserved & proxy
if both:
    fails.append(f'RESERVED IN THE CHAIN — {sorted(both)} appear in the reserved sweep AND as '
                 f'[PROXY DECISION] escalations (kernel.md:48-52 forbids it)')

# ---- 6. every BLOCKING reserved finding needs a digest ask.
# Derived from the sweep table itself, not from a prose sentence: a row whose
# delegable half says "take option X" is resolved without the human and blocks
# nothing; every other reserved row blocks and must appear in §8.
digest = t.split('## 8. Human digest')[-1].split('## 9.')[0]
# Only the numbered ask items count. Blockquoted frame text and the
# "counts reconciled" note both name findings without asking anything, and
# counting those made this check pass on prose alone.
asked = set()
cur = None
for line in digest.split('\n'):
    if re.match(r'^\d+\. \*\*\[', line):
        cur = True
    elif re.match(r'^\d+\. ', line) or line.lstrip().startswith('>') or line.startswith('## '):
        cur = None
    if cur:
        asked |= set(re.findall(r'[AB]-\d\d', line))
blocking = set()
if sweep:
    for row in sweep.group(1).strip().split('\n')[1:]:
        cells = [c.strip() for c in row.strip('|').split('|')]
        if len(cells) < 5:
            continue
        ids = re.findall(r'[AB]-\d\d', cells[0])
        if not ids:
            continue
        resolved = re.search(r'\*\*take (option )?\w+', cells[4], re.I)
        if not resolved:
            blocking |= set(ids)
if not blocking:
    fails.append('sanity: parsed zero blocking reserved findings — the sweep table shape changed '
                 'and this check has gone vacuous')
absent = blocking - asked
if absent:
    fails.append(f'reserved findings that block on the human but have NO digest ask: {sorted(absent)}')

# ---- 7. the data gate must exclude data/README.md, which unit 1.8.P owns.
# Blockquoted lines are skipped: the plan quotes the superseded gate inside a
# "corrected after the QA pass" note, and that quotation must stay verbatim.
for line in t.split('\n'):
    if line.lstrip().startswith('>'):
        continue
    for m in re.finditer(r'git diff --stat[^\n`]*data/[^\n`]*', line):
        if 'data/README.md' not in m.group(0):
            fails.append(f'live data gate does not exempt data/README.md, which 1.8.P owns, so '
                         f'it can never pass: "{m.group(0).strip()}"')

# ---- 8. no dangling section references
for m in re.finditer(r'§6 step (\d+[a-z]?)', t):
    step = m.group(1)
    if not re.search(r'^' + re.escape(step) + r'[.)] ', t, re.M) and \
       not re.search(r'^' + re.escape(step) + r'\. \*\*', t, re.M):
        fails.append(f'dangling reference to "§6 step {step}" — no such step')

print(f'{len(loc)} findings defined · {len(assign)} assigned · {len(defer)} deferred')
if fails:
    print('\nFAILURES:')
    for f in fails:
        print('  -', f)
    sys.exit(1)
print('unit counts reconcile · all 74 placed once · file ownership provably disjoint')
