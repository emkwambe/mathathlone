/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for catching bugs early
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Experimental features
  // (Previously declared as two separate `experimental:` keys; the second
  // silently shadowed the first. Merged here so both flags actually apply.)
  experimental: {
    // Production build requirement — auth pages use useSearchParams() under
    // a Suspense boundary; this flag tells Next not to bail out of CSR for
    // those pages during prerender.
    missingSuspenseWithCSRBailout: false,
    // Optimize package imports
    optimizePackageImports: ['katex'],
  },

  // Exclude large curriculum JSON files from webpack file-watching.
  //
  // The 6 JSON pools under docs/curriculum/<pool>/*.json are seeded into
  // Supabase via SQL migrations — they're never imported by application
  // code, so webpack has no reason to add them to its module graph or
  // watch them for changes. Excluding them avoids large-string
  // serialization and speeds up dev recompiles + production builds.
  //
  // NOTE: this hook is IGNORED when turbopack is active (`next dev --turbo`).
  // Turbopack has its own Rust-based watcher and doesn't need a manual
  // exclude — it's already very fast on this codebase. Still worth keeping
  // for `next build` (always webpack) and the non-turbo `next dev` fallback.
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/docs/curriculum/**', '**/node_modules/**'],
    };
    return config;
  },
};

module.exports = nextConfig;
