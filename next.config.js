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
      // Pilot operations are stateful. Never reuse a browser/CDN response for
      // a different session, roster, Heat, worksheet, or result state.
      {
        source: '/dashboard/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' }],
      },
      {
        source: '/assessment/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' }],
      },
      {
        source: '/compete/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }],
      },
      {
        source: '/auth/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }],
      },
      {
        source: '/league/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }],
      },
      {
        source: '/leaderboard',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }],
      },
    ];
  },

  // Optimize package imports. `missingSuspenseWithCSRBailout` was removed
  // in Next.js 16; the corresponding behavior is now built in.
  experimental: {
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
  // NOTE: this hook is ignored when Turbopack is active. The production
  // build script explicitly uses `--webpack` until this watcher customization
  // is migrated to an equivalent Turbopack configuration.
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/docs/curriculum/**', '**/node_modules/**'],
    };
    return config;
  },
};

module.exports = nextConfig;
