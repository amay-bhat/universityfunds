import type { MetadataRoute } from "next";
import { SITE_URL, DATA, COVERAGE_END_DATE } from "@/lib/site";

// Static routes plus one per school, derived from the seed files rather than
// listed by hand so a sixth school cannot be silently missing from the sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/explore", priority: 0.9 },
    { path: "/translate", priority: 0.8 },
    { path: "/compare", priority: 0.8 },
    { path: "/methodology", priority: 0.7 },
    { path: "/glossary", priority: 0.5 },
  ];
  return [
    ...staticRoutes.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified: COVERAGE_END_DATE,
      changeFrequency: "yearly" as const,
      priority: r.priority,
    })),
    ...DATA.schools.map((s) => ({
      url: `${SITE_URL}/explore/${s}`,
      lastModified: COVERAGE_END_DATE,
      changeFrequency: "yearly" as const,
      priority: 0.9,
    })),
  ];
}
