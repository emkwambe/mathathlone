# MathAthlone — Auth & RBAC Sprint Summary
**Date:** July 18, 2026  
**Engineer:** Manus AI (Mpingo Systems LLC)  
**Commit:** `90f103f`

---

## What Was Done

### 1. Registration Bug Fix (`src/app/auth/register/page.tsx`)

**Problem:** The "Fair Play Code" checkboxes on Step 3 were permanently disabled because the scroll-to-unlock logic required the user to scroll to the bottom of a container that had no overflow — the content was shorter than the `h-64` box on most screens, so the scroll event never fired.

**Fix:** Added a `useEffect` mount check that immediately sets `hasScrolledToBottom = true` if the content does not overflow the container. The checkboxes now unlock correctly on all screen sizes.

**Bonus:** Replaced the single `<input type="date">` for date of birth with a 3-dropdown picker (Month / Day / Year). This is significantly more usable for K-12 students on mobile devices.

---

### 2. Google & Microsoft SSO Buttons (`src/app/auth/login/page.tsx`)

**Problem:** `AuthContext.tsx` already had a fully working `signInWithProvider('google' | 'azure')` method and the `/auth/callback` route handler was in place, but no UI buttons existed to trigger it.

**Fix:** Added Google and Microsoft SSO buttons to the `EducatorLogin` component with:
- Inline SVG brand icons (no external image dependencies)
- Per-button loading spinners
- A styled "or sign in with email" divider
- Graceful error handling that surfaces Supabase error messages

> **Next step for Eddy:** Enable Google and Azure providers in the Supabase dashboard under Authentication → Providers. The code is ready — it just needs the OAuth credentials configured.

---

### 3. Edge-Level RBAC Enforcement (`src/lib/supabase/middleware.ts`)

**Problem:** The middleware only checked authentication (is the user logged in?) but not authorization (does the user have the right role for this route?). A Mathlete could navigate directly to `/dashboard/admin` or `/dashboard/teacher` and see the page.

**Fix:** Added a `ROLE_PROTECTED_ROUTES` table to the middleware that maps path prefixes to allowed roles. The check runs at the Vercel Edge before any page code executes.

| Route Prefix | Allowed Roles |
|---|---|
| `/dashboard/admin` | `platform_admin`, `school_admin`, `district_admin` |
| `/dashboard/teacher` | `teacher`, `school_admin`, `district_admin`, `platform_admin` |
| `/dashboard/parent` | `parent`, `platform_admin` |
| `/dashboard/broadcast` | `teacher`, `school_admin`, `district_admin`, `platform_admin` |
| `/compete/create` | `teacher`, `school_admin`, `district_admin`, `platform_admin` |

Unauthorized users are redirected to `/403`.

> **Note:** Role is read from `user.user_metadata.role` in the JWT. This is populated at sign-up via `signUp()` in `AuthContext`. For SSO users (Google/Microsoft), you will need a Supabase Database Webhook or a `handle_new_user()` trigger to assign the role on first login.

---

### 4. `useRequireRole` Hook (`src/hooks/useRequireRole.ts`)

A reusable client-side RBAC guard hook for Client Components. Complements the middleware layer.

```tsx
// Usage in any 'use client' component:
const { allowed, loading } = useRequireRole(['teacher', 'school_admin']);
if (loading || !allowed) return null; // RoleGuard handles the spinner
```

---

### 5. `RoleGuard` Component (`src/components/auth/RoleGuard.tsx`)

A drop-in wrapper for protecting entire Client Component pages:

```tsx
<RoleGuard roles={['teacher', 'school_admin']}>
  <TeacherOnlyContent />
</RoleGuard>
```

Shows a "Verifying access..." spinner while auth loads, then either renders children or redirects to `/403`.

---

### 6. `/403 Forbidden` Page (`src/app/403/page.tsx`)

A polished, on-brand 403 page with:
- Clear error message and support email link
- "Go to My Dashboard" and "Back to Home" buttons
- Added to `PUBLIC_ROUTES` so it is accessible without authentication

---

### 7. Live Platform Stats (`src/app/api/stats/route.ts` + `src/components/landing/LiveStats.tsx`)

**Problem:** The hero badge "1,247 mathletes competing right now" was hardcoded text — it never changed.

**Fix:**
- `/api/stats` — New API route that queries Supabase for `competingNow`, `activeMathletes`, and `heatsToday`. Cached for 60 seconds via `Cache-Control` headers.
- `LiveStats` — Client component that fetches from `/api/stats` on mount and polls every 60 seconds. Shows a shimmer placeholder while loading and gracefully falls back to "—" on error.

---

## What Still Needs to Be Done (Next Sprint)

| Priority | Task | File(s) |
|---|---|---|
| 🔴 Critical | Fix the Heat Engine column mismatch (`time_limit_minutes` vs `duration_seconds`) | `src/lib/heat-service.ts`, `src/app/compete/` |
| 🔴 Critical | Configure Google & Azure OAuth providers in Supabase dashboard | Supabase UI |
| 🟡 High | Add `handle_new_user()` Supabase trigger to assign role to SSO users | `supabase/migrations/` |
| 🟡 High | Add `useRequireRole` to Client Component dashboard pages | `src/app/dashboard/*/page.tsx` |
| 🟡 High | Add Google SSO button to the Mathlete login form | `src/app/auth/login/page.tsx` |
| 🟢 Medium | Replace hardcoded "142 Active mathletes" in Teacher Dashboard preview | `src/app/page.tsx` line 671 |
| 🟢 Medium | Add Admin role to the registration role picker | `src/app/auth/register/page.tsx` |
| 🟢 Medium | Wire `vercel.json` cache headers for static assets | `vercel.json` |
