import { ImageResponse } from "next/og";
import { DATA, sourceCount } from "@/lib/site";
import { SCHOOL_THEME } from "@/lib/school-theme";
import { SCHOOL_IDS } from "@/lib/constants";

// The share card every link to this site renders as.
//
// Why this exists: `layout.tsx` has declared `twitter: { card:
// "summary_large_image" }` since 2026-08-05 with no image behind it, so every
// shared link rendered as a bare text card. The 2026-08-13 persona work recorded
// that as the largest live gap, because the finance content creator is the only
// persona that distributes the site and sharing is the whole growth loop.
//
// Two rules this card follows, both inherited rather than invented:
//
// 1. **School identity is colour + initial, never a logo or seal.** Those are
//    trademarked and `school-theme.ts` already made that call for the site
//    chrome. This reuses that decision instead of re-litigating it.
// 2. **No chart.** A decorative plot at thumbnail size cannot carry the coverage
//    and basis annotations that CLAUDE.md rule 5 and Article 6 require of any
//    chart in this project, and data drawn without them is exactly what those
//    rules forbid. The card is typographic on purpose.
//
// Every figure on it derives from the seed files at build time, the same
// discipline as `sitemap.ts` and the Dataset JSON-LD — so a data refresh cannot
// leave the share card asserting a stale year.

export const alt =
  "University Endowment Investing Explorer — how Yale, Harvard, Stanford, MIT and Princeton " +
  "actually invested, from cited public documents. Education, not financial advice.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GRADIENT_STOPS = SCHOOL_IDS.map((id) => SCHOOL_THEME[id].color).join(", ");

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        {/* The site's own signature hairline, thickened for thumbnail legibility. */}
        <div
          style={{
            height: 14,
            width: "100%",
            display: "flex",
            background: `linear-gradient(to right, ${GRADIENT_STOPS})`,
          }}
        />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px 48px 64px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#a1a1aa",
              }}
            >
              University Endowment Investing Explorer
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontSize: 66,
                lineHeight: 1.1,
                fontWeight: 700,
                letterSpacing: -1.5,
                maxWidth: 980,
              }}
            >
              How the famous university endowments actually invested
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 28,
                lineHeight: 1.4,
                color: "#d4d4d8",
                maxWidth: 960,
              }}
            >
              What a buy-it-yourself ETF version looks like, and how it compares with simple
              index investing.
            </div>
          </div>

          {/* Colour + initial per school: identity without republishing a mark. */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {SCHOOL_IDS.map((id) => {
              const t = SCHOOL_THEME[id];
              return (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: t.color,
                    color: t.fg,
                    fontSize: 34,
                    fontWeight: 700,
                  }}
                >
                  {t.monogram}
                </div>
              );
            })}
            <div
              style={{
                display: "flex",
                marginLeft: 12,
                fontSize: 25,
                whiteSpace: "nowrap",
                color: "#e4e4e7",
              }}
            >
              {`FY${DATA.minFy}–FY${DATA.maxFy} · ${SCHOOL_IDS.length} endowments · ${sourceCount()} cited documents`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #27272a",
              paddingTop: 26,
              fontSize: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#fafafa",
              }}
            >
              Education, not financial advice
            </div>
            <div style={{ display: "flex", color: "#a1a1aa" }}>
              Free · no login · every number cited
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
