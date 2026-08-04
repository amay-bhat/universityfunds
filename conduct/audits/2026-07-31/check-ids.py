#!/usr/bin/env python3
"""Self-check: every A-/B- id referenced in prose or in verify.sh must name the
file the referencing sentence is actually about.

This exists because the first draft of the audit report referenced three ids
from inference rather than from the data, which is the exact defect class the
audit documents. Run it after any regeneration.
"""
import re, glob, os, sys

OUT = '/Users/amayb/Projects/dashboardProject/conduct/audits/2026-07-31'
os.chdir(OUT)

# 1. authoritative id -> location map, parsed from the rendered work orders
loc = {}
for f in sorted(glob.glob('WP*.md')) + ['BACKLOG.md']:
    t = open(f).read()
    for blk in re.finditer(r'^### ([AB]-\d+) · (.+?)$(.*?)(?=^### |\Z)', t, re.M | re.S):
        m = re.search(r'\*\*Location\*\* \| `([^`]+)`', blk.group(3))
        loc[blk.group(1)] = m.group(1) if m else '?'

print(f'{len(loc)} ids defined')

fails = []

# 2. README prose: an id cited in a sentence that names a file must agree
readme = open('README.md').read()
for m in re.finditer(r'\|\s*((?:`[AB]-\d+`\s*)+)\|([^|]*)\|', readme):
    ids = re.findall(r'[AB]-\d+', m.group(1))
    text = m.group(2)
    files = re.findall(r'`([A-Za-z0-9_./-]+\.(?:md|html|ts|sh|json))`', text)
    if not files:
        continue
    for i in ids:
        if i not in loc:
            fails.append(f'README cites undefined {i}')
            continue
        target = loc[i].split(':')[0]
        if target not in files:
            fails.append(f'README: {i} is {loc[i]} but its sentence names {files}')

# 3. verify.sh: each "A-NN: <message>" must not name a DIFFERENT finding's file
# while omitting its own. Naming an unrelated path (e.g. a fix destination like
# conduct/rulings/pool-basis.md) is legitimate and must not trip this.
known = {os.path.basename(v.split(':')[0]) for v in loc.values()}
vs = open('verify.sh').read()
for m in re.finditer(r'"([AB]-\d+): ([^"]{0,200})', vs):
    i, msg = m.group(1), m.group(2)
    if i not in loc:
        fails.append(f'verify.sh cites undefined {i}')
        continue
    own = os.path.basename(loc[i].split(':')[0])
    if own in msg:
        continue
    others = {k for k in known if k != own and k in msg}
    if others:
        fails.append(f'verify.sh: {i} is {loc[i]} but its message names {sorted(others)} '
                     f'and not {own} — "{msg[:70]}"')

# 4. comment markers like "# --- A-10: ..." must also agree
for m in re.finditer(r'#\s*---\s*([AB]-\d+(?:/[AB]-\d+)*)[^\n]*', vs):
    for i in re.findall(r'[AB]-\d+', m.group(1)):
        if i not in loc:
            fails.append(f'verify.sh comment cites undefined {i}')

# 5. every id defined exactly once, contiguous
for pre, n in (('A', 37), ('B', 37)):
    have = sorted(int(k.split('-')[1]) for k in loc if k.startswith(pre))
    if have != list(range(1, n + 1)):
        fails.append(f'{pre} ids not contiguous 1..{n}: {have}')

if fails:
    print('\nFAILURES:')
    for f in fails:
        print('  -', f)
    sys.exit(1)
print('all id references agree with the work orders they name')
