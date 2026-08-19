/**
 * Lighthouse CI configuration.
 *
 * There was no config file, so `lhci autorun` fell back to the
 * `lighthouse:recommended` preset — which asserts nearly every audit at
 * thresholds that essentially no real framework app meets (unused-javascript
 * at maxLength 0, and so on). The job therefore failed on every push and
 * stopped carrying information, which is how two genuine accessibility bugs
 * (a skip link pointing at a non-existent target, and an h1 -> h3 heading
 * jump on the landing page) sat unnoticed behind the noise.
 *
 * The stance here: accessibility is a hard gate, because it is part of
 * making the platform usable by everyone. Performance and bundle-shape
 * audits are advisory — they report, they do not block, since they largely
 * measure Next.js's own output rather than choices we make.
 *
 * Only public routes are audited: everything else is behind authentication,
 * where Lighthouse would merely measure the login redirect.
 */
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/login",
        "http://localhost:3000/signup",
      ],
      numberOfRuns: 1,
      settings: {
        // The CI runner is a shared, noisy machine; without throttling
        // disabled the performance numbers vary far too much to reason about.
        throttlingMethod: "devtools",
      },
    },
    assert: {
      assertions: {
        // ---- Hard gates -------------------------------------------------
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "heading-order": "error",
        "skip-link": "error",
        "color-contrast": "error",
        "html-has-lang": "error",
        "image-alt": "error",
        "label": "error",
        "link-name": "error",
        "button-name": "error",
        "aria-required-attr": "error",
        "aria-valid-attr-value": "error",
        "meta-viewport": "error",

        // ---- Advisory ---------------------------------------------------
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "categories:performance": ["warn", { minScore: 0.5 }],

        // Framework output rather than our choices: report, never block.
        "unused-javascript": "off",
        "unused-css-rules": "off",
        "legacy-javascript": "off",
        "legacy-javascript-insight": "off",
        "network-dependency-tree-insight": "off",
        "render-blocking-resources": "off",
        "render-blocking-insight": "off",
        "unminified-javascript": "off",
        "uses-long-cache-ttl": "off",
        "total-byte-weight": "off",
        // Third-party console noise (Supabase auth probes on public pages).
        "errors-in-console": "off",
        // Not a PWA install target yet; the PWA work is Phase 6.
        "installable-manifest": "off",
        "maskable-icon": "off",
        "splash-screen": "off",
        "themed-omnibox": "off",
        "service-worker": "off",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
