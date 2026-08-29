# Sprint 16A Plan — Security & Pilot Environment Hygiene

**Status:** Ready for implementation

**Scope:** A narrowly bounded security and operational-readiness release before provisioning the three-school pilot.

**Excluded:** Classroom/roster features, league hierarchy features, generator expansion, UI redesign, and database schema changes.

## Objective

Sprint 16A reduces risks that should not be carried into the three-school pilot. It upgrades the framework to the official patched 14.x release, eliminates plaintext reusable passwords from tracked source and documentation, makes the environment template complete without embedding values, adds automated dependency-update monitoring, and replaces the outdated single-class pilot guide with a safe current runbook.

> **Security boundary:** Removing credentials from the current repository does not remove them from Git history or the live authentication system. Every account password previously exposed in repository content must be rotated in Supabase Auth before pilot use.

## Implementation scope

| Workstream | Change | Acceptance criterion |
|---|---|---|
| Framework security remediation | Update `next` to `16.3.3`, `eslint-config-next` to `16.3.3`, and ESLint to the required 9.x line; regenerate `package-lock.json` using a non-breaking production audit fix. | `npm audit --omit=dev` reports zero production vulnerabilities. |
| Production credential removal | Remove the hard-coded development account password from the global client-side development account switcher. The development-only UI will require a password supplied locally at run time. | No password literal remains in client source. The component remains absent in production. |
| Repository credential hygiene | Redact all committed quick-start and handover passwords. Remove the historical patch artifact that embeds the same development password. | A tracked-file scan finds no `TestHeat2026!` or `devpass123` string. |
| Safe environment template | Include every required runtime variable in `.env.example`, including a blank `SUPABASE_SERVICE_ROLE_KEY`, while retaining placeholder-only values and clear server-only instructions. | A new developer can identify all required keys without receiving a real credential. |
| Next.js 16 compatibility | Migrate the root request guard from `middleware.ts` to `proxy.ts`, await dynamic route/page parameters, remove the retired experimental setting, and retain the existing custom Webpack watcher through an explicit build script. | `npm run build`, `npx tsc --noEmit`, and the supported ESLint CLI all pass. |
| Dependency monitoring | Add Dependabot configuration for weekly npm dependency pull requests. | GitHub can notify the repository of future package updates. |
| Pilot documentation | Replace the obsolete pilot guide with a current, credential-free controlled-rehearsal guide. Add a credential-rotation checklist for the platform administrator. | No guide asks teachers to use a password committed in Git; current Heat Config Builder, assessment, and Sprint 15 checks are documented. |

## Dependency rationale

The official Next.js December 2025 advisory establishes that the deployed App Router version must be upgraded because there is no workaround for the relevant React Server Components exposure.[1] The current production dependency audit further reports that the 14.x line remains affected by later high-severity advisories; its non-breaking remediation target is Next.js `16.3.3`. Sprint 16A therefore upgrades in an isolated copy first, retains the existing Webpack build path explicitly, migrates the request entrypoint to `proxy.ts`, and verifies every affected dynamic parameter path before release.[2] [3]

## Manual credential-rotation procedure

The patch can remove known passwords from the current repository, but it cannot safely rotate Supabase Auth credentials on the pilot operator’s behalf. After deploying this release, the platform administrator must use **Supabase Dashboard → Authentication → Users** to rotate passwords for every documented test/dev account, including former teacher, student, parent, school-admin, broadcast-host, and pilot accounts. Each replacement password must be unique and stored only in a private administrator-controlled credential system, not in Git, tickets, or public chat.

If any of the exposed accounts are no longer needed, delete or disable them rather than rotating them. If a remaining account used a password shared with any other system, rotate the password on every affected system.

## Verification plan

| Check | Command or action | Pass criterion |
|---|---|---|
| Locked install | `npm ci` | Dependency tree installs from `package-lock.json` without modification. |
| Production dependency audit | `npm audit --omit=dev --audit-level=high` | No high/critical production dependency findings; remaining lower-severity findings, if any, are recorded separately. |
| TypeScript | `npx tsc --noEmit` | Exit code 0. |
| Production build | `npm run build` | Exit code 0 and all routes compile. |
| Secret-pattern scan | Scan tracked files for removed known password literals and common private-key patterns. | No known test password or private key is present in a tracked file. |
| Documentation review | Open the updated pilot guide. | It contains no usable credentials and reflects the current Config Builder and Sprint 15 workflow. |

## Deployment order

First apply the patch locally and run the automated verification commands. Second, review and rotate the affected Supabase Auth accounts. Third, push the verified commit to GitHub `main` and deploy to Vercel. Finally, run the credential scan one more time on the pushed commit and ensure the production build reflects Next.js `16.3.3`.

No Supabase migration is required for Sprint 16A.

## Out of scope follow-on

Sprint 16B will establish the three-school pilot hierarchy and authority model. Sprint 16C will create teacher-managed class/roster operations and class-scoped Heat eligibility. Neither should begin until Sprint 16A has passed its security and documentation gates.

## References

[1]: https://nextjs.org/blog/security-update-2025-12-11 "Next.js Security Update: December 11, 2025"
[2]: https://nextjs.org/docs/app/guides/upgrading/version-16 "How to upgrade to version 16"
[3]: https://nextjs.org/docs/app/api-reference/config/eslint "Next.js ESLint Plugin configuration"
