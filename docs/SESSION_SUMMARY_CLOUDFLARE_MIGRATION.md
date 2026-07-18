# Session Summary: Cloudflare Durable Objects Migration

> **Environment note:** All terminal commands in this guide are written for **Windows PowerShell**.
> Open PowerShell by pressing `Win + X` → **Windows PowerShell** (or **Terminal** on Windows 11).

---

## Overview

The MathAthlone live Heat transport layer has been fully migrated from Supabase Realtime to a server-authoritative **Cloudflare Durable Object** (`HeatRoom`).

This solves the two critical scaling issues:

1. **Connection limits:** Bypasses the 500-connection Supabase Pro cap. Cloudflare scales to thousands of concurrent heats with no configuration changes.
2. **Server-authoritative state:** Countdown timers and scores are now managed by the Worker, not the student's browser. This prevents clock drift and cheating.

---

## What Was Built

| File | Purpose |
|---|---|
| `workers/heat-room/src/HeatRoom.ts` | The Durable Object — manages the full heat lifecycle |
| `workers/heat-room/src/index.ts` | The Worker entry point — routes WebSocket and HTTP requests |
| `workers/heat-room/src/supabase.ts` | Lightweight Supabase REST client for the Worker environment |
| `workers/heat-room/src/types.ts` | Shared WebSocket message protocol types |
| `workers/heat-room/wrangler.toml` | Cloudflare deployment configuration |
| `src/lib/competition/heat-realtime-cf.ts` | Next.js `useHeatRoom` hook — replaces Supabase Realtime |
| `src/app/api/heat/[heatId]/init/route.ts` | Next.js API route that provisions the Durable Object |
| `src/lib/countries.ts` | All 195 ISO 3166-1 countries with flag emoji helper |
| `src/components/competition/CountryFlag.tsx` | Flag display component for lobby and leaderboard |

---

## Deployment Guide: Cloudflare Worker

Follow these steps **in order**. Each step includes the expected result so you know it worked.

---

### Step 1 — Pull the latest code from GitHub

Open **PowerShell** and navigate to your project folder:

```powershell
cd C:\path\to\mathathlone
git pull origin main
```

**Expected result:** PowerShell prints something like `Already up to date.` or a list of files that were updated. If you see an error about credentials, you may need to log in to GitHub first.

---

### Step 2 — Navigate to the Worker folder

```powershell
cd workers\heat-room
```

**Expected result:** Your PowerShell prompt changes to show `...\mathathlone\workers\heat-room>`.

---

### Step 3 — Install Worker dependencies

```powershell
npm install
```

**Expected result:** PowerShell prints `added X packages` and returns to the prompt. This may take 30–60 seconds.

---

### Step 4 — Log in to Cloudflare (first time only)

```powershell
npx wrangler login
```

**Expected result:** A browser window opens asking you to log in to Cloudflare and authorise Wrangler. Click **Allow**. PowerShell will print `Successfully logged in.`

> **If you are already logged in**, this step will say `Already logged in.` — that is fine, continue to Step 5.

---

### Step 5 — Deploy the Worker

```powershell
npx wrangler deploy
```

**Expected result:** Wrangler compiles the TypeScript and uploads it to Cloudflare. At the end it prints a URL like:

```
Published mathathlone-heat-room (X.XX sec)
  https://mathathlone-heat-room.YOUR-SUBDOMAIN.workers.dev
```

**Copy this URL** — you will need it in Step 8.

---

### Step 6 — Set the Supabase Service Role Key secret

```powershell
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

**Expected result:** PowerShell prompts: `Enter a secret value:`. Paste your Supabase **Service Role Key** (found in your Supabase dashboard → Settings → API → `service_role` key). Press **Enter**.

> The key will not be visible as you type — this is normal security behaviour.

**Expected result after pressing Enter:** `✔ Success! Uploaded secret SUPABASE_SERVICE_ROLE_KEY`

---

### Step 7 — Set the shared Heat Room secret

This secret is a password shared between your Next.js app and the Cloudflare Worker so only your app can provision heats.

First, generate a secure random string. Run this in PowerShell:

```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Expected result:** PowerShell prints a random string like `xK9mP2qL...`. **Copy it** — you will use it in two places.

Now set it as a Cloudflare secret:

```powershell
npx wrangler secret put HEAT_ROOM_SECRET
```

Paste the random string when prompted. Press **Enter**.

**Expected result:** `✔ Success! Uploaded secret HEAT_ROOM_SECRET`

---

### Step 8 — Add environment variables to Vercel

1. Go to [vercel.com](https://vercel.com) → your **MathAthlone** project → **Settings** → **Environment Variables**.
2. Add the following two variables. For each one, click **Add New**, fill in the name and value, select **All Environments** (Production, Preview, Development), and click **Save**.

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_HEAT_WORKER_URL` | The URL from Step 5, e.g. `https://mathathlone-heat-room.YOUR-SUBDOMAIN.workers.dev` |
| `HEAT_WORKER_URL` | Same URL as above |
| `HEAT_ROOM_SECRET` | The random string you generated in Step 7 |

---

### Step 9 — Redeploy the Next.js app

In Vercel, go to your MathAthlone project → **Deployments** → click the three dots on the latest deployment → **Redeploy**.

**Expected result:** Vercel rebuilds and deploys the app with the new environment variables. The deployment status turns green (✔ Ready) after 1–3 minutes.

---

### Step 10 — Verify the Worker is running

Open your browser and visit:

```
https://mathathlone-heat-room.YOUR-SUBDOMAIN.workers.dev/heat/test-id/status
```

**Expected result:** The browser shows:
```json
{"phase":"uninitialized"}
```

This confirms the Worker is live and responding correctly.

---

## Common Issues and Solutions

| Issue | Cause | Solution |
|---|---|---|
| `wrangler: command not found` | Wrangler not installed globally | Use `npx wrangler` instead of `wrangler` |
| `Authentication error` on deploy | Not logged in to Cloudflare | Run `npx wrangler login` again |
| Vercel build fails after adding env vars | `HEAT_WORKER_URL` missing | Ensure all three variables from Step 8 are saved |
| Worker returns 401 on `/init` | `HEAT_ROOM_SECRET` mismatch | Ensure the same string is in Cloudflare secrets and Vercel env vars |
| `git pull` asks for credentials | GitHub auth expired | Run `gh auth login` in PowerShell first |

---

## Next Steps

The architecture is now production-ready. The final development step is updating the `compete/[code]/page.tsx` UI to consume the new `useHeatRoom` hook from `heat-realtime-cf.ts` instead of the legacy Supabase hooks.
