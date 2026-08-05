import type { NextConfig } from "next";

// Security headers. Production previously returned only Vercel's default HSTS —
// no CSP, no X-Frame-Options, no X-Content-Type-Options, no Referrer-Policy and
// no Permissions-Policy (audited 2026-08-05).
//
// A strict CSP is achievable here because the app is genuinely self-contained:
// no third-party <script>, no iframe, no external fetch, and `next/font/google`
// self-hosts its font files at build time rather than loading from
// fonts.gstatic.com. All three verified by grep before this was written.
//
// ON `'unsafe-inline'` FOR SCRIPTS — a deliberate trade, not an oversight.
// Next's App Router injects inline bootstrap and RSC-payload scripts, and the
// site emits inline JSON-LD. Dropping `'unsafe-inline'` means nonce-based CSP,
// which needs middleware on every request — and that would force every route
// dynamic, discarding the static and ISR rendering this content site depends on.
// `script-src 'self'` still blocks loading REMOTE script, which is the vector
// that matters for a site with no user input, no authentication and no writes.
// Revisit if the site ever accepts input or ships a login.
const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is dev-only: Next's HMR requires it, production does not.
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Removes the `x-powered-by: Next.js` version disclosure.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Redundant with frame-ancestors, kept for browsers predating it.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), midi=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
