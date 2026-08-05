// Summarises / diffs the JSON produced by verify-cross-browser.mjs.
//   node scripts/xb-summarize.mjs conduct/audits/data/xb-chrome-1280-light.json [more.json...]
import { readFileSync } from "node:fs";

const files = process.argv.slice(2);
const runs = files.map((f) => ({ f, d: JSON.parse(readFileSync(f, "utf8")) }));

for (const { f, d } of runs) {
  console.log(`\n${"=".repeat(78)}\n${d.engine} @${d.width} ${d.scheme}  (${f})`);
  const first = Object.values(d.routes).find((r) => r.ua);
  if (first) console.log(`UA: ${first.ua}`);
  if (first) console.log(`viewport: ${first.env.innerWidth}x${first.env.innerHeight} dpr=${first.env.dpr} dark=${first.env.dark} bodyBg=${first.env.bodyBg} textSizeAdjust=${first.env.htmlTextSizeAdjust}`);
  if (first) console.log(`supports: ${JSON.stringify(first.supports)}`);

  for (const [route, r] of Object.entries(d.routes)) {
    if (r.error) { console.log(`\n-- ${route}  ERROR: ${r.error}`); continue; }
    console.log(`\n-- ${route}`);
    if (r.overflowX.overflows) {
      console.log(`   PAGE OVERFLOWS X: scrollWidth=${r.overflowX.docScrollWidth} client=${r.overflowX.docClientWidth}`);
      for (const o of r.overflowX.offenders) console.log(`      ${o.tag}.${o.cls} l=${o.left} r=${o.right} "${o.text}"`);
    }
    for (const s of r.scrollers || []) {
      const kb = r.keyboard?.reachedScrollers?.[String(s.idx)];
      console.log(`   scroller#${s.idx} ${s.tag} ox=${s.overflowX} oy=${s.overflowY} sx=${s.scrollableX}(${s.overflowAmountX}px) sy=${s.scrollableY}(${s.overflowAmountY}px) tabindex=${s.tabindexAttr} focusableKids=${s.focusableDescendants} ORPHAN=${s.keyboardOrphan} label=${JSON.stringify(s.label)}`);
      console.log(`        reachedByTab=${kb ? "YES @tab" + kb.tabStop : "NO"} keyboardScrolled=${kb ? kb.scrolledByKeyboard : "-"} ${kb ? JSON.stringify(kb.after) : ""}`);
    }
    if (r.keyboard) console.log(`   tabStops=${r.keyboard.tabStops}`);
    for (const dd of r.details || [])
      console.log(`   details "${dd.summaryText}" display=${dd.summaryDisplay} cursor=${dd.summaryCursor} listStyle=${dd.summaryListStyle} wkMarker=${dd.webkitDetailsMarkerDisplay} marker=${dd.markerContent} opens=${dd.opensAndRevealsBody} h ${dd.closedHeight}->${dd.openHeight}`);
    for (const sh of r.stickyHeaders || [])
      console.log(`   sticky ${JSON.stringify(sh.label)} pos=${sh.position} top=${sh.top} z=${sh.zIndex} bg=${sh.background} border=${sh.borderBottom} collapse=${sh.tableBorderCollapse} scrolledBy=${sh.scrolledBy} thTop ${sh.thTopBeforeScroll}->${sh.thTopAfterScroll} PINNED=${sh.staysPinned} transparentBg=${sh.transparentBackground}`);
    for (const g of r.gradientText || [])
      console.log(`   bg-clip-text "${g.text}" clip=${g.backgroundClip}/wk=${g.webkitBackgroundClip} color=${g.color} rect=${g.rect.w}x${g.rect.h} RISK=${g.atRiskInvisible} bgImg=${g.backgroundImage}`);
    if (r.vizTokens) console.log(`   vizTokens colorScheme=${r.vizTokens.colorScheme} surface=${r.vizTokens.surface} series1=${r.vizTokens.series1} axis=${r.vizTokens.axis}`);
    for (const sv of r.svg || []) {
      console.log(`   SVG ${JSON.stringify(sv.chart)} ${sv.svgWidth}x${sv.svgHeight} bars=${sv.barCount} halos=${sv.haloCount}`);
      for (const b of sv.bars) console.log(`      bar fillAttr=${b.fillAttr} -> computed=${b.computedFill} | strokeAttr=${b.strokeAttr} -> ${b.computedStroke} fillOpacity=${b.fillOpacity}`);
      for (const t of sv.texts) {
        const clip = [t.clippedLeft && "L", t.clippedRight && "R", t.clippedTop && "T", t.clippedBottom && "B"].filter(Boolean).join("");
        console.log(`      text "${t.text}" halo=${t.isHalo} paintOrderAttr=${t.paintOrderAttr} computed=${JSON.stringify(t.computedPaintOrder)} stroke=${t.stroke}@${t.strokeWidth} fill=${t.fill} fs=${t.fontSize} bbox=${JSON.stringify(t.bbox)} adv=${t.advance} rect=[${t.rect.l},${t.rect.t} ${t.rect.r},${t.rect.b}] CLIP=${clip || "-"} barsOver=${t.barsOverlapped ?? "-"}`);
      }
    }
    if ((r.smallTapTargets || []).length)
      for (const t of r.smallTapTargets) console.log(`   smallTap ${t.tag} ${t.w}x${t.h} "${t.text}" cls=${t.cls}`);
  }
}
