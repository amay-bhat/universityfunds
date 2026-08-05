import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// There was no robots.txt at all until 2026-08-05, so crawling was permitted by
// default with no sitemap pointer and no control. Everything here is public
// education content and should be indexed; the only disallow is Next's internals.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/_next/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
