import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only: proxy the local Supabase stack through the dev server so
  // sandboxed preview browsers (which can only reach port 3000) can auth.
  // Enabled by `npm run dev:local`.
  ...(process.env.LOCAL_SUPABASE_PROXY === "1" && {
    async rewrites() {
      return [
        {
          source: "/sb-local/:path*",
          destination: "http://127.0.0.1:54321/:path*",
        },
      ];
    },
  }),
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
    scrollRestoration: true,
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/feed',
        permanent: true,
      },
    ];
  },

  // ESLint configuration for production
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration for production
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default withSentryConfig(nextConfig, {
  // Source-map upload happens only when SENTRY_AUTH_TOKEN is set (CI/Vercel);
  // local builds without it are unaffected.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  disableLogger: true,
  widenClientFileUpload: true,
});