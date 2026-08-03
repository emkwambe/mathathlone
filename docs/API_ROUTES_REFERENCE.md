# MathAthlone — API Routes Reference

> Sprint 4 additions. All routes require an authenticated Supabase session cookie.

---

## `POST /api/league/heat-complete`

Triggered automatically by `heat-service.ts` when a heat ends and the heat has a `league_id`. Calls `LeagueEngineService.processHeatResult()` to update ELO ratings and league standings.

**Request body:**
```json
{
  "heatId": "uuid",
  "leagueId": "uuid"
}
```

**Success response (200):**
```json
{
  "ok": true,
  "heatId": "uuid",
  "leagueId": "uuid",
  "participantsProcessed": 16
}
```

**Error responses:**
- `400` — missing `heatId` or `leagueId`
- `404` — heat not found
- `422` — no finished participations found
- `500` — engine error (details in `error` field)

**Notes:**
- Idempotent: calling it twice for the same heat is safe (engine checks `heat_processed` flag).
- ELO updates use Glicko-2 with a 400-point K-factor for the first 5 games, then standard K=32.

---

## `POST /api/league/bracket/generate`

Generates a bracket for a league. Only the league owner (`created_by = current user`) can call this.

**Request body:**
```json
{
  "leagueId": "uuid",
  "format": "single_elim",
  "name": "Playoffs"
}
```

`format` must be one of: `single_elim`, `double_elim`, `swiss`, `round_robin`.

**Success response (200):**
```json
{
  "ok": true,
  "bracketId": "uuid",
  "format": "single_elim",
  "rounds": 4,
  "matchesCreated": 15
}
```

**Error responses:**
- `400` — missing fields or invalid format
- `403` — caller is not the league owner
- `404` — league not found
- `422` — fewer than 2 standings entries (cannot generate bracket)
- `500` — engine error

**Notes:**
- If a bracket already exists for the league, it is replaced (old bracket and matches are deleted first).
- Seeds are assigned by current ELO rating (highest ELO = seed 1).

---

## `POST /api/league/split/close`

Closes the current split for a season and triggers advancement: the top N mathletes from each source league are promoted to the target league (as defined in `league_advancement`).

**Request body:**
```json
{
  "seasonId": "uuid",
  "splitId": "uuid"
}
```

**Success response (200):**
```json
{
  "ok": true,
  "splitId": "uuid",
  "advancementsTriggered": 64,
  "mathletesMoved": 128
}
```

**Error responses:**
- `400` — missing `seasonId` or `splitId`
- `403` — caller does not have `school_admin` or `platform_admin` role
- `404` — split not found
- `422` — split is already closed
- `500` — engine error

**Notes:**
- This is an admin-only action. Teachers cannot call it.
- Advancement inserts rows into `league_memberships` for the target league and creates `league_standings` entries with `rank = 0` (to be recalculated after the first heat).

---

## Existing routes (pre-Sprint 4)

| Route | Method | Description |
|---|---|---|
| `/api/heats` | POST | Create a new heat |
| `/api/heats/[id]/join` | POST | Join a heat lobby |
| `/api/heats/[id]/submit` | POST | Submit heat answers |
| `/api/heats/[id]/end` | POST | End a heat (teacher) |
| `/api/auth/callback` | GET | Supabase OAuth callback |

---

## Authentication

All API routes use `createSupabaseServer()` to get the current user from the session cookie. There is no separate JWT — the Supabase session is the auth token.

For server-to-server calls (e.g., from the Cloudflare scoring worker), use the `SUPABASE_SERVICE_ROLE_KEY` in the `Authorization: Bearer <key>` header.
