# Next.js 16 Cache-Control Notes for Mathathlone Pilot Operations

## Purpose

This note records the official Next.js findings used for the navigation and freshness remediation begun on 2026-09-03. The intent is to avoid stale session, roster, Heat, worksheet, and result state during the pilot while retaining ordinary caching for public marketing assets where appropriate.

## Official findings

| Finding | Source | Pilot implication |
|---|---|---|
| In the non-Cache-Components model, `dynamic = 'force-dynamic'` forces request-time rendering and makes route fetches behave as `no-store` / `revalidate: 0`. | [Next.js: Caching and Revalidating (Previous Model)](https://nextjs.org/docs/app/guides/caching-without-cache-components) | Explicitly mark authenticated, operational server pages as dynamic when current data is required. |
| Route Handlers are not cached by default in current Next.js guidance; GET handlers can opt into caching. Request-specific data, headers, cookies, or dynamic operations cause request-time handling. | [Next.js: Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) | Avoid adding caching to operational APIs. Use explicit no-store headers for defense in depth and clarity on sensitive responses. |
| The experimental `staleTimes` setting controls client-router segment caching. Defaults are `dynamic: 0` seconds and `static: 5 minutes`; it does not affect browser back/forward caching. | [Next.js: staleTimes](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes) | Do not enable a broad client-router cache for the pilot. Do not rely on it to correct security or roster freshness. Use targeted route behavior and mutation refreshes instead. |

## Production observations before remediation

A deployed-header check on 2026-09-03 found public routes (`/` and `/compete`) were served with `Cache-Control: public, max-age=0, must-revalidate`; the public statistics endpoint was served from Vercel cache despite source-level stale-while-revalidate intent. Sensitive pages and operational APIs lacked an explicit common no-store response policy. The platform and class consoles already use `fetch(..., { cache: 'no-store' })` for their mutable lists and explicitly reload after mutation.

## Scope guard

No cache policy should weaken authentication, access to direct Heat lobbies, or active class-roster admission. The standalone `/compete` code-entry page may be public, but a specific `/compete/[code]` route remains protected and its eventual response must not be stored as reusable user content.

## References

1. [Next.js — Caching and Revalidating (Previous Model)](https://nextjs.org/docs/app/guides/caching-without-cache-components)
2. [Next.js — Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
3. [Next.js — `staleTimes` configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes)
