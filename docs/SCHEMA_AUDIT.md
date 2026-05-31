# MathAthlone Schema Audit

**Generated:** 2026-05-31
**Author:** Schema audit sprint (read-only)
**Source of truth (canonical):** `supabase/migrations/*.sql` + live database
**Project ref (from `.env.local`):** `yhqxxgqfpgcertsqibps`

---

## 0. How this document was produced — and its limits

### What this audit IS
- A consolidation of every CREATE TABLE / ALTER TABLE / CREATE TYPE / CREATE POLICY / CREATE FUNCTION statement across the `supabase/migrations/` tree.
- A gap analysis against the sprint requirements (heats, heat_participations, heat_awards, division_curricula, curriculum hierarchy).
- A flagged list of inconsistencies, migration-numbering collisions, and seed data shortfalls.

### What this audit is NOT (yet)
- It is **not** verified against the live Supabase database. The Supabase project `yhqxxgqfpgcertsqibps` (from `.env.local`) is **not visible to the currently logged-in CLI account** (the `supabase projects list` output for this account did not include that ref). Direct SQL execution against the project was therefore not possible from this sprint.
- "Migration files say X" ≠ "the database has X." Migrations may have been edited after they ran, may have failed midway, may have been applied in a different order than the filename ordering implies (see Section 8 — migration ordering issues are real here).

### REQUIRED FOLLOW-UP — run the queries below in Supabase SQL Editor

Run every block in Section 9 against the live database. Paste the results back into the placeholder blocks in Sections 1–7. Every column name in any new code MUST match the live result, not this audit's migration-derived expectation.

---

## 1. Core competition tables (migration-derived)

### `heats`

Base definition: `supabase/mathathlone-schema.sql` lines 166–203.
Extensions: `003_integrity_system.sql` Part 6 (lines 332–337).

| Column | Type | Nullable | Default | Source |
|---|---|---|---|---|
| `id` | uuid | NO | `uuid_generate_v4()` | base |
| `code` | char(7) | NO | (generated via `generate_heat_code()`) UNIQUE | base |
| `topic_id` | uuid | NO | — FK → topics(id) | base |
| `depth_min` | integer | NO | 1, CHECK 1..4 | base |
| `depth_max` | integer | NO | 3, CHECK 1..4 | base |
| `type` | heat_type | NO | `'official'` | base |
| `scope` | heat_scope | NO | `'class'` | base |
| `class_id` | uuid | YES | — FK → classes(id) ON DELETE SET NULL | base |
| `school_id` | uuid | YES | — FK → schools(id) ON DELETE SET NULL | base |
| `created_by` | uuid | NO | — FK → users(id) | base |
| `status` | heat_status | NO | `'scheduled'` | base |
| `scheduled_at` | timestamptz | YES | — | base |
| `started_at` | timestamptz | YES | — | base |
| `ended_at` | timestamptz | YES | — | base |
| `question_count` | integer | NO | 20 | base |
| `duration_seconds` | integer | NO | 900 | base |
| `participant_count` | integer | YES | 0 | base |
| `created_at` | timestamptz | NO | `NOW()` | base |
| `updated_at` | timestamptz | NO | `NOW()` | base |
| `integrity_level` | integrity_level | YES | `'practice'` | 003 |
| `requires_attestation` | boolean | YES | false | 003 |
| `attestation_id` | uuid | YES | — FK → teacher_attestations(id) | 003 |
| `synchronized_start_at` | timestamptz | YES | — | 003 |
| `lockdown_required` | boolean | YES | false | 003 |

Constraints: `CONSTRAINT valid_depth_range CHECK (depth_min <= depth_max)`.

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY A1 — see Section 9 ]
```

---

### `heat_participations`

Base: `supabase/mathathlone-schema.sql` lines 218–258.
Extensions: `003_integrity_system.sql` Part 6 (lines 339–349).

| Column | Type | Nullable | Default | Source |
|---|---|---|---|---|
| `id` | uuid | NO | `uuid_generate_v4()` | base |
| `heat_id` | uuid | NO | — FK → heats(id) ON DELETE CASCADE | base |
| `athlete_id` | uuid | NO | — FK → users(id) ON DELETE CASCADE | base |
| `status` | participation_status | NO | `'queued'` | base |
| `joined_at` | timestamptz | NO | `NOW()` | base |
| `synced_at` | timestamptz | YES | — | base |
| `started_at` | timestamptz | YES | — | base |
| `finished_at` | timestamptz | YES | — | base |
| `questions_attempted` | integer | YES | 0 | base |
| `questions_correct` | integer | YES | 0 | base |
| `first_touch_correct` | integer | YES | 0 | base |
| `total_time_ms` | integer | YES | 0 | base |
| `content_score` | decimal(10,2) | YES | — | base |
| `time_score` | decimal(10,2) | YES | — | base |
| `accuracy_score` | decimal(10,2) | YES | — | base |
| `cta_score` | decimal(10,2) | YES | — | base |
| `rank_in_heat` | integer | YES | — | base |
| `percentile` | decimal(5,2) | YES | — | base |
| `medal` | medal_type | YES | — | base |
| `ranking_points_earned` | integer | YES | 0 | base |
| `focus_violations` | jsonb | YES | `'[]'` | base int + reassigned by 003 |
| `accuracy_multiplier` | decimal(3,2) | NO | 1.0 | base |
| `voided_reason` | text | YES | — | base |
| `created_at` | timestamptz | NO | `NOW()` | base |
| `updated_at` | timestamptz | NO | `NOW()` | base |
| `focus_violation_count` | integer | YES | 0 | 003 |
| `total_away_time_ms` | integer | YES | 0 | 003 |
| `is_flagged` | boolean | YES | false | 003 |
| `flag_reason` | text | YES | — | 003 |
| `anomaly_count` | integer | YES | 0 | 003 |
| `integrity_score` | integer | YES | 100 | 003 |
| `lockdown_verified` | boolean | YES | false | 003 |
| `session_recording_url` | text | YES | — | 003 |

> ⚠ **Column-type conflict for `focus_violations`:** Base schema declares `focus_violations INTEGER NOT NULL DEFAULT 0`. Migration 003 then does `ADD COLUMN IF NOT EXISTS focus_violations JSONB DEFAULT '[]'`. The `IF NOT EXISTS` guard means the JSONB version is **skipped** if the integer column already exists. Live DB likely has integer here, not JSONB. **Verify before any code writes to this column.**

Unique constraint: `UNIQUE (heat_id, athlete_id)`.

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY A2 ]
```

---

### `heat_questions`

Source: `002_league_system.sql` lines 68–83 (re-created identically in `004_nc_math_1_seed.sql` lines 57–71).
The preflight `000_preflight_rename_legacy.sql` renames any pre-existing `heat_questions` to `heat_questions_legacy` if it lacks `question_latex` or `generator_id`.

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `heat_id` | uuid | YES | — FK → heats(id) ON DELETE CASCADE |
| `question_number` | integer | NO | — |
| `generator_id` | uuid | YES | — FK → question_generators(id) |
| `difficulty` | integer | NO | CHECK 1..4 |
| `question_latex` | text | NO | — |
| `question_text` | text | NO | — |
| `correct_answer` | text | NO | — |
| `answer_type` | text | NO | — |
| `solution_steps` | jsonb | YES | — |
| `points_value` | integer | YES | 100 |
| `time_limit_seconds` | integer | YES | 90 |
| `created_at` | timestamptz | YES | `NOW()` |

Unique: `UNIQUE(heat_id, question_number)` (declared in 002; **not declared** in 004's re-creation — verify it actually exists in live DB).

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY A3 ]
```

---

### `question_submissions`

Source: `002_league_system.sql` lines 86–97; re-created in `004_nc_math_1_seed.sql` lines 73–83.

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `heat_participation_id` | uuid | YES | — FK → heat_participations(id) ON DELETE CASCADE |
| `heat_question_id` | uuid | YES | — FK → heat_questions(id) ON DELETE CASCADE |
| `submitted_answer` | text | YES | — |
| `is_correct` | boolean | YES | — |
| `time_taken_ms` | integer | YES | — |
| `attempt_number` | integer | YES | 1 |
| `points_earned` | integer | YES | 0 |
| `submitted_at` | timestamptz | YES | `NOW()` |

Unique: `UNIQUE(heat_participation_id, heat_question_id, attempt_number)` declared in 002; **not** in 004. Verify live.

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY A4 ]
```

---

> Note: Migration 002 / 004 also created a separate older `submissions` table (`supabase/mathathlone-schema.sql` lines 261–285). **That table is the legacy/v1 path.** New code should use `question_submissions`. Document its presence in the live audit but treat it as deprecated.

---

## 2. User/school tables (migration-derived)

### `users`

Base: `supabase/mathathlone-schema.sql` lines 51–72.
Extended by `006_auth_v2_schema.sql` Part 3 (lines 229–248).

| Column | Type | Source |
|---|---|---|
| `id` | uuid PK | base |
| `email` | varchar(255) UNIQUE | base |
| `role` | user_role (enum, see Section 4) | base |
| `display_name` | varchar(100) | base |
| `avatar_url` | text | base |
| `country_code` | char(2) | base |
| `date_of_birth` | date | base |
| `grade_level` | integer (CHECK 1..12) | base |
| `school_id` | uuid FK → schools(id) | base |
| `fair_play_acknowledged_at` | timestamptz | base |
| `parent_consent_at` | timestamptz | base |
| `proctor_certified_at` | timestamptz | base |
| `is_active` | boolean | base |
| `last_login_at` | timestamptz | base |
| `created_at`, `updated_at` | timestamptz | base |
| `coppa_consent_id` | uuid FK → parental_consents(id) | 006-auth |
| `ferpa_authorized_at` | timestamptz | 006-auth |
| `ferpa_authorizing_school_id` | uuid FK → schools(id) | 006-auth |
| `data_minimization_tier` | text CHECK ∈ `('minimal','standard','full')` default `'minimal'` | 006-auth |
| `deleted_at` | timestamptz (soft delete) | 006-auth |
| `deletion_requested_at` | timestamptz | 006-auth |
| `deletion_requested_by` | uuid FK → auth.users(id) | 006-auth |
| `deletion_reason` | text | 006-auth |

> ⚠ **Role-enum mismatch:** `users.role` uses the legacy `user_role` enum (`athlete, teacher, parent, school_admin, judge, platform_admin`). The new auth v2 system uses a separate `app_role` enum (`mathlete, parent, teacher, school_admin, district_admin, platform_admin, broadcast_host`). The `handle_new_user_v2` trigger (`008_auth_v2_seed.sql` lines 252–272) maps `mathlete → athlete` for the `users.role` text. **Roles `district_admin` and `broadcast_host` are NOT valid values for the legacy `user_role` enum, so the trigger will fail when inserting users with those app_roles.** New code should treat `user_roles.role` (the new table, see Section 5) as authoritative — not `users.role`.

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY B1 ]
```

---

### `schools`

Base: `supabase/mathathlone-schema.sql` lines 37–48 (+ FK on `admin_user_id` added line 75–77).
Extended in `006_auth_v2_schema.sql` lines 217–224 and `007_identity_fields.sql` lines 14–21.

| Column | Type | Source |
|---|---|---|
| `id` | uuid PK | base |
| `name` | varchar(255) | base |
| `district` | varchar(255) | base |
| `state` | varchar(100) | base |
| `country_code` | char(2) default `'US'` | base |
| `license_tier` | text default `'free'` (note: base had `license_tier` enum, then 006-auth overrode to text) | base + 006-auth |
| `license_expires_at` | timestamptz | base |
| `admin_user_id` | uuid FK → users(id) | base (FK added separately) |
| `created_at`, `updated_at` | timestamptz | base |
| `email_domains` | text[] | 006-auth |
| `sso_provider` | text | 006-auth |
| `sso_config` | jsonb | 006-auth |
| `district_id` | uuid FK → districts(id) | 006-auth |
| `verified` | boolean | 006-auth |
| `verified_at` | timestamptz | 006-auth |
| `verified_by` | uuid FK → auth.users(id) | 006-auth |
| `city` | text | 007-identity |
| `mascot` | text | 007-identity |
| `primary_color` | text | 007-identity |
| `secondary_color` | text | 007-identity |
| `state_name` | text | 007-identity |
| `country_name` | text default `'United States'` | 007-identity |
| `country_flag` | text default `'🇺🇸'` | 007-identity |

> ⚠ **Type conflict for `license_tier`:** Base declares `license_tier license_tier NOT NULL DEFAULT 'free'` (enum). `006_auth_v2_schema.sql` line 221 does `ADD COLUMN IF NOT EXISTS license_tier TEXT DEFAULT 'free'` — the `IF NOT EXISTS` guard means it is skipped if the enum column already exists. Live DB likely has the **enum** version. Verify.

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY B2 ]
```

---

### `topics` (LEGACY — do not use in new code)

Source: `supabase/mathathlone-schema.sql` lines 120–130.

| Column | Type |
|---|---|
| `id` | uuid PK |
| `name` | varchar(100) |
| `category` | topic_category enum |
| `grade_band` | grade_band enum |
| `description` | text |
| `is_active` | boolean |
| `display_order` | integer |
| `created_at`, `updated_at` | timestamptz |

Base schema seeds 7 rows: Linear Equations, Quadratic Equations, Fractions & Decimals, Ratios & Proportions, Angles & Lines, Area & Perimeter, Basic Statistics, Probability.

> ⚠ **DEPRECATED:** `topics` is the v1 content reference. The current curriculum lives in `courses → unit_topics → atomic_concepts → question_generators` (Section 6). `heats.topic_id` still references this table (FK declared in base, never dropped). **New code should not write to `topics`** but reads will remain compatible while `heats.topic_id` is still present.

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY B3 ]
```

---

## 3. Divisions (current data)

Seeded in both `002_league_system.sql` lines 321–326 and `004_nc_math_1_seed.sql` lines 216–221. Both inserts are identical (D1/D2/D3/D4).

| code | name | grade_min | grade_max | display_order |
|---|---|---|---|---|
| D1 | Rising Stars | 4 | 5 | 1 |
| D2 | Challengers | 6 | 7 | 2 |
| D3 | Contenders | 8 | 9 | 3 |
| D4 | Varsity | 10 | 12 | 4 |

> ⚠ **Minor discrepancy with vision doc:** `MATHATHLONE_OPEN_PLATFORM_VISION.md` Section 2.4 lists Rising Stars as Grades **3–5**, but the DB seed is **4–5**. Reconcile before public messaging.

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY C — `SELECT * FROM divisions ORDER BY display_order;` ]
```

---

## 4. Custom enums (migration-derived)

### From `supabase/mathathlone-schema.sql` (base)
| Enum | Values |
|---|---|
| `user_role` | `athlete, teacher, parent, school_admin, judge, platform_admin` |
| `license_tier` | `free, bronze, silver, gold, platinum` |
| `heat_type` | `official, practice` |
| `heat_scope` | `class, school, global` |
| `heat_status` | `scheduled, open, in_progress, calculating, complete, cancelled` |
| `participation_status` | `queued, synced, competing, finished, voided, abandoned` |
| `medal_type` | `gold, silver, bronze` |
| `depth_level` | `1, 2, 3, 4` |
| `violation_type` | `focus, velocity, suspected_solver, answer_sharing, identity` |
| `violation_severity` | `warning, penalty, disqualification` |
| `violation_status` | `flagged, under_review, confirmed, cleared, appealed, final` |
| `self_report_reason` | `help_received, saw_screen, used_resource, other` |
| `enrollment_status` | `active, removed` |
| `parent_link_status` | `pending, active, revoked` |
| `topic_category` | `algebra, geometry, statistics, number_sense, mixed` |
| `grade_band` | `5-6, 7-8, 9-10, 11-12` |

### From `003_integrity_system.sql`
| Enum | Values |
|---|---|
| `integrity_level` | `practice, school, district, regional, state, national` |
| `violation_type` | `tab_switch, window_blur, fullscreen_exit, copy_attempt, paste_attempt, right_click, dev_tools, screenshot_attempt, lockdown_exit` |
| `anomaly_type` | `speed_anomaly, score_spike, timing_pattern, answer_pattern, consistency_anomaly` |
| `attestation_type` | `supervision, identity_verification, advancement_approval, results_certification` |
| `advancement_status` | `pending_review, under_review, approved, denied, requires_verification_heat, disqualified` |

> ⚠ **`violation_type` defined twice with INCOMPATIBLE values.** Base declares `(focus, velocity, suspected_solver, answer_sharing, identity)`. Migration 003 attempts to create another `violation_type` enum with web-event values (`tab_switch`, etc.) but wraps it in `EXCEPTION WHEN duplicate_object THEN NULL`. **Result: in live DB, `violation_type` has the BASE values.** This means `focus_violations.violation_type` cannot accept any of `tab_switch / window_blur / fullscreen_exit / ...` and **inserts will fail.** This is a real bug — confirm and write a migration to either rename the second enum or add the missing values via `ALTER TYPE ... ADD VALUE`.

### From `006_auth_v2_schema.sql` (auth v2)
| Enum | Values |
|---|---|
| `app_role` | `mathlete, parent, teacher, school_admin, district_admin, platform_admin, broadcast_host` |
| `app_permission` | `heats.create, heats.delete, heats.proctor, heats.broadcast, users.read.school, users.read.district, users.read.platform, users.invite.mathlete, users.invite.teacher, attest.regional, attest.state, integrity.review, data.export.school, data.export.district, data.delete.minor, consent.grant.parent` |
| `consent_method` | `credit_card, government_id, kba, text_plus, school_ferpa, parent_managed_setup, video_conf, signed_form` |
| `consent_status` | `pending, verified, expired, revoked` |
| `auth_event_type` | `login_success, login_failure, logout, password_reset_request, password_reset_complete, passkey_register, passkey_authenticate, role_grant, role_revoke, permission_grant, permission_revoke, consent_grant, consent_revoke, mfa_challenge, mfa_success, mfa_failure, account_lock, account_unlock, data_export, data_deletion, sso_login, sso_link, sso_unlink` |

### From `006_league_engine.sql`
| Enum | Values |
|---|---|
| `tournament_format` | `swiss, round_robin, single_elim, double_elim, pool_knockout` |
| `bracket_side` | `winners, losers` |
| `bracket_status` | `pending, scheduled, live, completed, cancelled` |
| `qualification_method` | `auto, points, playin, invitation` |
| `split_status` | `upcoming, active, playoffs, completed` |
| `heat_format` | `sprint, target, team, countdown` |

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY D ]
```

> ⚠ Heads-up: the sprint requirements list `(official, practice, sprint, target, championship)` as the expected `heat_type` enum. **The actual `heat_type` enum only has `(official, practice)`.** The values `sprint, target, championship` are **heat template codes** (`heat_templates.code`), not heat-type enum values. Either (a) extend `heat_type` to include them, or (b) update the spec to reflect that "Sprint/Target/Championship" are template choices, not types.

---

## 5. RLS policies (migration-derived)

### `heats`
Latest active policies set by `007_auth_v2_rls.sql` (drops all prior policies first):
| Policy | Command | Condition |
|---|---|---|
| Read own heats | SELECT | `created_by = auth.uid()` |
| Read participated heats | SELECT | `id IN (SELECT heat_id FROM heat_participations WHERE athlete_id = auth.uid())` |
| Read public broadcast heats | SELECT | `id IN (SELECT heat_id FROM broadcast_heats WHERE is_live = true)` ⚠ **`broadcast_heats` table is not defined in any migration** |
| Teachers read school heats | SELECT | `has_role('teacher','school_admin','district_admin','platform_admin') AND created_by IN (SELECT id FROM users WHERE school_id = user_school_id())` |
| Create heats with permission | INSERT | `authorize('heats.create') AND created_by = auth.uid()` |
| Update own heats | UPDATE | `created_by = auth.uid()` |
| Delete heats with permission | DELETE | `authorize('heats.delete') OR created_by = auth.uid()` |

> ⚠ The "Read public broadcast heats" policy references `broadcast_heats` which is not created by any migration. Any read against `heats` that triggers this policy's USING clause will **error**.
> ⚠ The recursion-fix `008_fix_rls_recursion.sql` re-declares `authorize`, `has_role`, `user_school_id` as `SECURITY DEFINER` to avoid infinite recursion. Confirm these definitions match the live DB.

### `heat_participations`
Latest from `007_auth_v2_rls.sql`:
| Policy | Command | Condition |
|---|---|---|
| Read own participations | SELECT | `athlete_id = auth.uid()` |
| Heat creator reads participations | SELECT | `heat_id IN (SELECT id FROM heats WHERE created_by = auth.uid())` |
| Teachers read school participations | SELECT | `has_role('teacher','school_admin','district_admin','platform_admin') AND athlete_id IN (SELECT id FROM users WHERE school_id = user_school_id())` |
| Parents read child participations | SELECT | via `parental_consents` |
| Join heat as participant | INSERT | `athlete_id = auth.uid()` |
| Update own participation | UPDATE | `athlete_id = auth.uid()` |

### `heat_questions`
| Policy | Command | Condition |
|---|---|---|
| Read questions of joined heats | SELECT | participation-based |
| Heat creators read questions | SELECT | `heat_id IN (SELECT id FROM heats WHERE created_by = auth.uid())` |
| Heat creators insert questions | INSERT | same |
| (Earlier migration 004 also added) Read heat questions | SELECT USING (true) | overridden by 007 drop |

### `question_submissions`
| Policy | Command | Condition |
|---|---|---|
| Read own submissions | SELECT | participation-based |
| Heat creators read submissions | SELECT | through heats |
| Insert own submissions | INSERT | participation-based |

### `topics`
| Policy | Command | Condition |
|---|---|---|
| topics_select | SELECT | `TRUE` (base) |

### `static_questions`
| Policy | Command | Condition |
|---|---|---|
| Public read static_questions | SELECT | `is_active = true` (004) |

### `divisions`
| Policy | Command | Condition |
|---|---|---|
| Public can read divisions | SELECT | `true` (002) |
| Public read divisions | SELECT | `true` (004) |

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY E ]
```

---

## 6. Award/medal/ranking tables

### `medals`
Base: `supabase/mathathlone-schema.sql` lines 322–331.
| Column | Type |
|---|---|
| `id` | uuid PK |
| `athlete_id` | uuid FK → users(id) |
| `heat_id` | uuid FK → heats(id) |
| `participation_id` | uuid FK → heat_participations(id), UNIQUE |
| `type` | medal_type |
| `awarded_at` | timestamptz |

### `achievements`
Base: `supabase/mathathlone-schema.sql` lines 334–344. Seeded with 8 rows (FIRST_HEAT, GOLD_1, GOLD_10, GOLD_50, STREAK_5, CENTURY, PERFECT, PROMOTED).
| Column | Type |
|---|---|
| `id` | uuid PK |
| `code` | varchar(50) UNIQUE |
| `name` | varchar(100) |
| `description` | text |
| `icon_url` | text |
| `category` | varchar(50) |
| `threshold_value` | integer |
| `is_active` | boolean |
| `created_at` | timestamptz |

### `user_achievements`
Base: lines 347–354.
| Column | Type |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid FK |
| `achievement_id` | uuid FK |
| `earned_at` | timestamptz |

### `rankings`
Base: lines 292–319.
| Column | Type |
|---|---|
| `id` | uuid PK |
| `athlete_id` | uuid FK |
| `grade_level` | integer CHECK 1..12 |
| `season` | varchar(20) |
| `ranking_points` | integer |
| `rank_position` | integer |
| `heats_completed` | integer |
| `gold_medals` / `silver_medals` / `bronze_medals` | integer |
| `avg_cta_score`, `avg_content_score`, `avg_time_score`, `avg_accuracy_score` | decimal(10,2) |
| `last_calculated_at` | timestamptz |
| `created_at`, `updated_at` | timestamptz |

UNIQUE `(athlete_id, grade_level, season)`.

> ⚠ **`heat_awards` table does NOT exist in any migration.** See Section 7 — required for the sprint.

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY F ]
```

---

## 7. Curriculum hierarchy

### `courses`
Defined in `002_league_system.sql` lines 13–23 and again in `004_nc_math_1_seed.sql` lines 10–21 (the latter without UNIQUE on `code` in CREATE — added separately by `DO $$ ALTER TABLE ... $$`).

| Column | Type |
|---|---|
| `id` | uuid PK |
| `name` | text NOT NULL UNIQUE (UNIQUE declared in 002 only) |
| `code` | text NOT NULL UNIQUE |
| `grade_band` | text NOT NULL |
| `state` | text default `'NC'` |
| `description` | text |
| `display_order` | integer |
| `is_active` | boolean default true |
| `created_at` | timestamptz |

**Seed conflict:** 002 inserts `('NC Math 1', 'M1', '9', 'NC', ...)`. 004 inserts `('NC Math 1', 'NCM1', '9', 'NC', ...)`. Whichever ran second produced an ON CONFLICT DO NOTHING — so live DB has whichever code came first depending on migration order. **This affects every downstream join.** Verify which code value exists.

### `unit_topics`
Defined in 002 lines 26–34, re-created in 004 lines 23–30.
| Column | Type |
|---|---|
| `id` | uuid PK |
| `course_id` | uuid FK → courses(id) ON DELETE CASCADE |
| `name` | text |
| `code` | text |
| `display_order` | integer |
| `created_at` | timestamptz |

UNIQUE `(course_id, code)` declared in 002 only.

**Seed:** 002 lines 354–365 inserts 8 unit_topics for course `M1`:
1. Equations & Inequalities (EQN)
2. Functions & Linear Functions (FLF)
3. Systems of Equations & Inequalities (SYS)
4. Exponents & Exponential Functions (EXP)
5. Polynomials & Factoring (POLY)
6. Quadratic Functions & Equations (QUAD)
7. Data Analysis & Statistics (DAS)
8. Geometric Transformations & Congruence (GEO.TRANS)

> ⚠ If live DB has course code `NCM1` (from 004) and not `M1`, **these 8 unit_topics never seed** because the WITH clause `SELECT id FROM courses WHERE code = 'M1'` returns no rows.

### `atomic_concepts`
Defined in 002 lines 37–47, re-created in 004 lines 32–42.
| Column | Type |
|---|---|
| `id` | uuid PK |
| `unit_topic_id` | uuid FK |
| `lesson_number` | text UNIQUE (declared by `002_league_system_SAFE.sql` only; in canonical 002 it's UNIQUE in the CREATE; in 004 it is **not** UNIQUE) |
| `name` | text |
| `key_skills` | text |
| `state_standard` | text |
| `display_order` | integer |
| `is_generator_ready` | boolean default false |
| `created_at` | timestamptz |

**Seed:** Only **5 sample concepts** seeded in `002_league_system.sql` lines 368–377 (M1.EQN.2.2 through M1.EQN.2.6). **No bulk seed exists for the other ~106 lessons** documented in `docs/NC_Math_1.json` (which contains 111 lessons across 8 unit topics).

### `question_generators`
Defined in 002 lines 50–65, re-created in 004 lines 44–54.
| Column | Type |
|---|---|
| `id` | uuid PK |
| `concept_id` | uuid FK → atomic_concepts(id) |
| `generator_type` | text UNIQUE |
| `answer_type` | text |
| `difficulty_config` | jsonb |
| `example_question` | text |
| `example_answer` | text |
| `is_active` | boolean default true |
| `created_at` | timestamptz |

**Seed in DB (002 lines 380–391):** Only **5 generators** (`linear_eq_one_step_add`, `linear_eq_one_step_mult`, `linear_eq_two_step`, `linear_eq_multi_step`, `linear_eq_both_sides`).

**Generators present in code (`src/lib/competition/generators.ts` lines 1584–1654):** **54 generator_type keys**, grouped:
- **Equations & Expressions (14):** evaluate_expression, simplify_expression, linear_eq_one_step_add, linear_eq_one_step_mult, linear_eq_two_step, linear_eq_multi_step, linear_eq_both_sides, abs_value_equation, literal_equation, inequality_one_step_add, inequality_one_step_mult, inequality_multi_step, compound_inequality, abs_value_inequality
- **Linear Functions (9):** evaluate_function, calculate_slope, write_linear_eq, write_linear_eq_points, point_slope_form, convert_linear_forms, parallel_line_slope, perp_line_slope, write_parallel_perp_eq
- **Systems (4):** system_substitution, system_elimination_basic, system_elimination_mult, system_solution_type
- **Exponents (7):** evaluate_exponent, exponent_product_quotient, exponent_power_rules, exponent_zero_negative, exponent_simplify_all, identify_growth_decay, write_exponential_eq
- **Polynomials (9):** add_polynomials, subtract_polynomials, multiply_mono_poly, multiply_binomials, factor_gcf, factor_trinomial_a1, factor_trinomial_a_ne_1, factor_diff_squares, factor_perfect_square
- **Quadratics (4):** quadratic_vertex, quadratic_factor_solve, quadratic_sqrt_solve, quadratic_formula
- **Statistics (3):** calculate_central_tendency, calculate_variability, calculate_residual
- **Transformations (4):** translate_point, reflect_point, rotate_point, transform_sequence

> 🚨 **49 of the 54 code-level generators have no `question_generators` row in the seed migrations.** Any attempt to insert a `heat_questions` row with `generator_id` for one of those 49 will fail (the row must already exist). **NEEDS MIGRATION: seed all 54 generator rows linked to their atomic_concepts.**

### `static_questions`
Defined in `004_nc_math_1_seed.sql` lines 145–169. Seeded with ~50 rows for non-generator concepts.

| Column | Type |
|---|---|
| `id` | uuid PK |
| `concept_id` | text (NOT a UUID FK — string lesson_number like `'M1.EQN.1.1'`) |
| `concept_name` | text |
| `course` | text default `'NC Math 1'` |
| `question_type` | text CHECK ∈ (`multiple_choice, true_false, select_all, image_choice`) |
| `question_text` | text |
| `question_latex` | text |
| `question_image_url` | text |
| `options` | jsonb |
| `option_images` | jsonb |
| `correct_answer` | text |
| `correct_answer_index` | integer |
| `explanation` | text |
| `solution_steps` | jsonb |
| `difficulty` | integer 1..4 |
| `category` | text |
| `tags` | jsonb |
| `times_used` | integer |
| `times_correct` | integer |
| `is_active` | boolean |
| `is_verified` | boolean |
| `created_by` | uuid (NO FK declared) |
| `created_at` | timestamptz |

> Note: `concept_id` here is a **text lesson_number**, not a UUID — it does NOT reference `atomic_concepts.id`. New code joining static_questions ↔ atomic_concepts must use `static_questions.concept_id = atomic_concepts.lesson_number`.

**Live verification of counts (paste here):**
```
[ PASTE RESULT OF QUERY G2 ]
courses:             [n]
unit_topics:         [n]
atomic_concepts:     [n]
question_generators: [n]
static_questions:    [n]
```

**Live verification — unit topics linked to NC Math 1 (paste here):**
```
[ PASTE RESULT OF QUERY G3 ]
```

---

## 8. League engine tables (from `006_league_engine.sql`)

| Table | Purpose | Defined at |
|---|---|---|
| `splits` | Sub-season tournaments (1–4 per season) | 006-league lines 60–73 |
| `athlete_ratings` | Glicko-2 rating per athlete per division | 79–102 |
| `rating_history` | Audit log of every rating change | 108–123 |
| `brackets` | Tournament brackets per league/split | 129–146 |
| `bracket_matches` | Individual matches within brackets | 152–185 |
| `league_standings` | Per-league per-athlete standings with Buchholz/Sonneborn-Berger | 191–221 |
| `head_to_head` | Pairwise head-to-head records | 227–245 |
| `championship_points` | Points earned per athlete per split | 251–264 |
| `season_standings` | Aggregate season totals | 270–286 |
| `qualification_rules` | Advancement thresholds (auto, points, playin) | 292–312 |
| `rating_anomalies` | Cheat-detection flags on rating | 318–328 |

`athlete_ratings` columns (Glicko-2 ready):
- `rating decimal(7,2) default 1200.00`
- `rating_deviation decimal(6,2) default 350.00`
- `volatility decimal(8,6) default 0.060000`
- `games_played, peak_rating, floor_rating, is_provisional, last_competition`
- Constraints: `rating BETWEEN 800 AND 3000`, `rd BETWEEN 30 AND 350`

`league_standings` columns: `rank, wins, losses, draws, points, heats_played, total_cta, avg_cta, best_cta, buchholz, buchholz_cut1, sonneborn_berger, first_places, avg_accuracy, avg_speed_ms, current_elo, elo_change`.

Materialized view: `global_leaderboard` (lines 372–398), refreshed by `refresh_global_leaderboard()` function. Filters `WHERE u.role = 'athlete' AND ar.games_played >= 5`.

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY H ]
```

---

## 9. Integrity tables (from `003_integrity_system.sql`)

| Table | Purpose |
|---|---|
| `integrity_configs` | One row per `integrity_level` (practice/school/district/regional/state/national) with feature flags & violation thresholds |
| `focus_violations` | Per-participation incident log (tab_switch, fullscreen_exit, etc.) |
| `detected_anomalies` | Server-side anomaly detector output |
| `teacher_attestations` | Hashed teacher sign-offs (supervision, identity, advancement) |
| `qualification_reviews` | Per-athlete advancement gate |

`integrity_configs` columns include feature flags: `focus_mode_enabled, fullscreen_required, copy_paste_blocked, lockdown_browser_required, synchronized_start, teacher_attestation_required, identity_verification_required, session_recording_enabled, anomaly_detection_enabled, in_person_verification_heat`, plus thresholds `warning_threshold, penalty_threshold, flag_threshold, disqualify_threshold, time_penalty_seconds, point_penalty_percent`.

Seeded with 6 rows (one per level). Practice is permissive (`999/999/999/999`), National is strict (`1/1/1/2`, full proctoring flags).

`focus_violations` columns: `id, heat_participation_id, violation_type, question_number, timestamp, duration_ms, user_agent, screen_resolution, warning_shown, penalty_applied, penalty_seconds, created_at`.

> 🚨 See Section 4 — `violation_type` enum collision means `focus_violations.violation_type` may not actually accept the web-event values it claims to. **Verify on live DB.**

`teacher_attestations` columns: `id, attestation_type, heat_id, heat_participation_id, athlete_id, league_id, teacher_id, teacher_name, teacher_email, school_id, attestation_text, signature_hash, ip_address, user_agent, is_valid, revoked_at, revoked_reason, created_at`.

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY I ]
```

---

## 10. Helper functions (migration-derived)

| Function | Source | Behavior |
|---|---|---|
| `generate_heat_code()` | base | Returns `MA-XXXX` unique heat code |
| `generate_class_code()` | base | Returns 6-char unique class code |
| `calculate_cta_score(content, time, accuracy)` | base | `0.5*content + 0.3*time + 0.2*accuracy` |
| `check_grace_period()` | base | Trigger to set `self_reports.within_grace_period` |
| `update_updated_at()` | base | Trigger to set `updated_at = NOW()` |
| `is_under_13(uuid)`, `is_minor(uuid)` | 006-auth | DOB-based predicates |
| `custom_access_token_hook(jsonb)` | 006-auth | Injects `user_role`, `permissions`, `school_id`, `district_id` into JWT (Supabase Auth Hook) |
| `user_role()`, `user_school_id()`, `user_district_id()` | 006-auth + redefined by 008-fix-rls | Read claims from `auth.jwt()` |
| `authorize(app_permission)` | 006-auth + redefined by 008-fix-rls | Boolean from JWT permissions array |
| `has_role(VARIADIC app_role[])` | 006-auth + redefined by 008-fix-rls | Boolean |
| `handle_new_user_v2()` | 008-auth-seed | Trigger on `auth.users` insert; populates `public.users` + `user_roles` + `auth_events` |
| `calculate_school_week_results(uuid)` | 002 + 005 | Aggregates a league week's results |
| `update_league_standings(uuid)` | 002 + 005 | Recomputes league ranks |
| `recalculate_season_totals(uuid)` | 006-league | Aggregates championship_points into season_standings |
| `set_updated_at()` | 006-league | Trigger function |
| `check_provisional_status()` | 006-league | Trigger: athlete leaves provisional after 5 games |
| `bracket_match_advance()` | 006-league | Trigger: cascade winners through bracket |
| `process_bracket_byes()` | 006-league | Trigger: auto-complete byes |
| `refresh_global_leaderboard()` | 006-league | REFRESH MATERIALIZED VIEW CONCURRENTLY |
| `get_integrity_config(integrity_level)` | 003 | Returns the row for a level |
| `check_violation_threshold(uuid)` | 003 | Returns true if participation exceeds flag_threshold |
| `calculate_integrity_score(uuid)` | 003 | 100 - 10·violations - 15·anomalies - away_time/10000 |
| `trigger_check_flag()` | 003 | Trigger on `focus_violations` insert |

> ⚠ **Definition source for `authorize / has_role / user_school_id`:** Two competing definitions exist.
> - `006_auth_v2_schema.sql` defines them as `STABLE` (no SECURITY DEFINER, no users-table query — reads from JWT).
> - `008_fix_rls_recursion.sql` redefines them as `SECURITY DEFINER STABLE` **and queries the `users` table directly** (NOT the JWT).
>
> The latter "wins" if 008 ran after 006. The live behavior depends on which version is current. **Verify by running `SELECT prosrc FROM pg_proc WHERE proname IN ('authorize','has_role','user_school_id')` (Query J).**

**Live verification result (paste here):**
```
[ PASTE RESULT OF QUERY J ]
```

---

## 11. Gap analysis — what new sprints will need

### 🚨 MISSING — needs migration: `heat_awards`
Sprint requirement: `id, heat_id, athlete_id, division_id, raw_score, accuracy_pct, percentile, award_level, created_at`. **No table named `heat_awards` exists in any migration.** Closest analogues: `medals` (one row per heat per medalist) and `rankings` (seasonal). Neither carries `division_id`, `raw_score`, `accuracy_pct`, `award_level`.

### 🚨 MISSING — needs migration: `division_curricula`
Sprint requirement: `id, division_id FK→divisions, course_id FK→courses, created_at`. **No table named `division_curricula` exists.** Currently there is no link table between `divisions` and `courses` — they are completely disjoint.

### 🚨 MISSING — needs migration on `heats`
| Required column | Status |
|---|---|
| `division_id` | **MISSING** — `heats` has `class_id` and `school_id` but no `division_id` FK |
| `is_global` | **MISSING** — referenced in `MATHATHLONE_OPEN_PLATFORM_VISION.md` Section 5.2 but never created |
| `division_code` | **MISSING** — same source, never created |
| `auto_scheduled` | **MISSING** — same source, never created |

### 🚨 MISSING — needs migration on `heat_participations`
| Required column | Status / proposal |
|---|---|
| `display_name` | MISSING. Currently joined from `users.display_name`. Adding as a denormalized snapshot column would survive user renames. |
| `division_id` | MISSING — no FK to divisions |
| `current_question` | MISSING — no in-progress pointer column exists |

### ⚠ NAME MISMATCHES vs requirements (data exists, name differs)
| Required name | Actual column | Where |
|---|---|---|
| `questions_answered` | `questions_attempted` | base schema |
| `total_points` | `ranking_points_earned` | base schema |
| `accuracy` | `accuracy_score` (decimal) | base schema |
| `avg_time_ms` | `total_time_ms` | base schema (and there's no `avg_time_ms` computed column) |
| `completed_at` | `finished_at` | base schema |

Decision needed: rename columns OR alias them in queries/types. Renaming is cleaner but touches every existing call site.

### 🚨 MISSING SEED DATA
- **`question_generators`:** 5 of 54 seeded. Need rows for the remaining 49 generator_types from `src/lib/competition/generators.ts`. Each row needs a valid `concept_id` FK → an `atomic_concepts` row with the matching `lesson_number`.
- **`atomic_concepts`:** 5 of ~111 seeded. The full curriculum is documented in `docs/NC_Math_1.json` (111 lesson_number entries across 8 unit topics).
- **`unit_topics`:** Only seeded if course `M1` exists. If course `NCM1` (from migration 004) is the surviving row, the 8 unit_topics from 002 never inserted. **Verify, then seed against the actual course code.**

### ⚠ MIGRATION FILE COLLISIONS (numbering)
The `supabase/migrations/` directory contains **two files for prefixes 006, 007, 008**:

| Prefix | File A | File B |
|---|---|---|
| 006 | `006_auth_v2_schema.sql` | `006_league_engine.sql` |
| 007 | `007_auth_v2_rls.sql` | `007_identity_fields.sql` |
| 008 | `008_auth_v2_seed.sql` | `008_fix_rls_recursion.sql` |

The order in which these ran is **non-deterministic** depending on tooling (filesystem listing order, `supabase db push`, manual SQL Editor runs). Migration `008_fix_rls_recursion.sql` redefines `authorize/has_role/user_school_id` **incompatibly** with `006_auth_v2_schema.sql` — the surviving definition depends on order.

**Action:** Renumber the files monotonically (e.g., 006, 007, 008, 009, 010, 011) and run them in an explicit, recorded order. Then verify by hashing function bodies.

### ⚠ DUPLICATE ENUM `violation_type` (Section 4 detail)
Both base and 003 declare `CREATE TYPE violation_type`. Only the first survives. **`focus_violations.violation_type` likely cannot accept its intended values.** Either rename the integrity-system enum (e.g., `focus_violation_type`) or `ALTER TYPE violation_type ADD VALUE ...` for each web-event value.

### ⚠ DUPLICATE COURSE INSERTS (Section 7 detail)
`courses` is seeded twice: 002 uses `code='M1'`, 004 uses `code='NCM1'`. Whichever ran first wins; the other is `ON CONFLICT DO NOTHING`. **Pick one, drop the other from migrations.**

### ⚠ DANGLING REFERENCE: `broadcast_heats`
RLS policy "Read public broadcast heats" on `heats` references `broadcast_heats` — **table not created by any migration.** Will raise an error on SELECTs that engage the policy.

### ⚠ `topics` table is legacy but still FK'd from `heats.topic_id`
`heats.topic_id` is `NOT NULL REFERENCES topics(id)`. If you want to migrate to `unit_topics` / `atomic_concepts`, you must either (a) keep writing to `topics` for compatibility, (b) make `topics.id` synonymous with `unit_topics.id`, or (c) drop the FK and add a new `heats.unit_topic_id` (preferred).

### ⚠ `users.role` legacy enum vs `app_role`
`handle_new_user_v2` casts `app_role` values back into the legacy `user_role` text column. **The legacy enum lacks `district_admin` and `broadcast_host`**, so signing up as one of those will silently downgrade (to `mathlete → athlete`) or fail. Either extend `user_role` or stop writing to `users.role` and rely on `user_roles`.

---

## 12. SQL queries to run for live verification

> Run these in the Supabase SQL Editor for project `yhqxxgqfpgcertsqibps` and paste the outputs into the "Live verification result" blocks above. The query labels (A1, A2, B1, etc.) correspond to the "PASTE RESULT OF QUERY X" markers in the sections above.

### Query A1 — heats columns
```sql
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='heats'
ORDER BY ordinal_position;
```

### Query A2 — heat_participations columns
```sql
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='heat_participations'
ORDER BY ordinal_position;
```

### Query A3 — heat_questions columns
```sql
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='heat_questions'
ORDER BY ordinal_position;
```

### Query A4 — question_submissions columns
```sql
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='question_submissions'
ORDER BY ordinal_position;
```

### Query B1 — users columns
```sql
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public' AND table_name='users'
ORDER BY ordinal_position;
```

### Query B2 — schools columns
```sql
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public' AND table_name='schools'
ORDER BY ordinal_position;
```

### Query B3 — topics columns
```sql
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public' AND table_name='topics'
ORDER BY ordinal_position;
```

### Query C — divisions data
```sql
SELECT * FROM divisions ORDER BY display_order;
```

### Query D — all custom enums
```sql
SELECT t.typname, e.enumlabel, e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;
```

### Query E — RLS policies on competition tables
```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('heats','heat_participations','heat_questions',
                    'question_submissions','topics','static_questions','divisions')
ORDER BY tablename, policyname;
```

### Query F — award/medal columns
```sql
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('medals','achievements','user_achievements','rankings')
ORDER BY table_name, ordinal_position;
```

### Query G — curriculum hierarchy columns
```sql
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('courses','unit_topics','atomic_concepts',
                     'question_generators','static_questions')
ORDER BY table_name, ordinal_position;
```

### Query G2 — curriculum data counts
```sql
SELECT 'courses' AS tbl, COUNT(*) AS cnt FROM courses
UNION ALL SELECT 'unit_topics', COUNT(*) FROM unit_topics
UNION ALL SELECT 'atomic_concepts', COUNT(*) FROM atomic_concepts
UNION ALL SELECT 'question_generators', COUNT(*) FROM question_generators
UNION ALL SELECT 'static_questions', COUNT(*) FROM static_questions;
```

### Query G3 — unit_topics ↔ courses linkage
```sql
SELECT ut.id, ut.name, ut.code, c.name AS course_name, c.code AS course_code
FROM unit_topics ut
LEFT JOIN courses c ON ut.course_id = c.id
ORDER BY ut.display_order;
```

### Query G4 — orphaned topics
```sql
SELECT * FROM topics ORDER BY name;
```

### Query G5 — question_generators present vs expected
```sql
SELECT generator_type FROM question_generators ORDER BY generator_type;
-- Expected 54 keys per src/lib/competition/generators.ts (see Section 7).
```

### Query G6 — courses code(s) actually in DB
```sql
SELECT id, name, code, grade_band, state FROM courses ORDER BY display_order;
```

### Query H — league engine columns
```sql
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('athlete_ratings','league_standings','brackets','bracket_matches')
ORDER BY table_name, ordinal_position;
```

### Query I — integrity tables
```sql
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('integrity_configs','focus_violations','teacher_attestations')
ORDER BY table_name, ordinal_position;
```

### Query J — helper function sources
```sql
SELECT proname, pg_get_function_identity_arguments(oid) AS args,
       prosecdef AS is_security_definer,
       prosrc
FROM pg_proc
WHERE proname IN ('authorize','has_role','user_school_id','user_district_id',
                  'user_role','set_updated_at','handle_new_user_v2',
                  'custom_access_token_hook');
```

### Query K — does `broadcast_heats` table actually exist?
```sql
SELECT to_regclass('public.broadcast_heats') AS broadcast_heats_exists;
-- NULL means missing. Any non-null oid means it exists.
```

### Query L — does `heat_awards` exist?
```sql
SELECT to_regclass('public.heat_awards') AS heat_awards_exists;
```

### Query M — does `division_curricula` exist?
```sql
SELECT to_regclass('public.division_curricula') AS division_curricula_exists;
```

### Query N — full list of public tables (sanity)
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE'
ORDER BY table_name;
```

### Query O — full list of public enums
```sql
SELECT t.typname FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname='public' AND t.typtype='e'
ORDER BY t.typname;
```

---

## 13. Single-source-of-truth rules for future sprints

1. **Never assume a column name.** Re-query `information_schema.columns` (Query A1–A4, B1–B3) before writing any SQL.
2. **`heat_awards` and `division_curricula` do not exist** — design a migration first; don't reference them in app code until migrated.
3. **`question_generators` has only 5 rows.** Until the seed migration is run, `heat_questions.generator_id` will be NULL for 49 of 54 generators. Either seed first or make `generator_id` nullable in the engine logic.
4. **Use `user_roles` not `users.role`** for authorization. `users.role` is the legacy text column with an inferior enum.
5. **Use `question_submissions` not `submissions`.** The base `submissions` table is v1 and should be considered deprecated.
6. **Use `unit_topics`/`atomic_concepts` not `topics`** for curriculum lookup. `topics` is legacy; `heats.topic_id` will be migrated to `heats.unit_topic_id` in a future sprint.
7. **`focus_violations.violation_type` may not accept web-event values** until the enum collision (Section 4) is fixed.
8. **Verify migration order locally** before assuming any 006/007/008 behavior — the file numbering is ambiguous (Section 11).

---

## 14. Suggested follow-up migrations (NOT executed in this sprint)

Order matters. None of these should run before the live verification queries are completed.

1. **`009_fix_violation_type_enum.sql`** — rename the integrity violation type enum to `focus_violation_type` and `ALTER TABLE focus_violations ALTER COLUMN violation_type TYPE focus_violation_type USING ...`.
2. **`010_global_heats_schema.sql`** — `heats` ADD COLUMN `is_global boolean, division_id uuid FK, division_code text, auto_scheduled boolean`. Add index per vision Section 5.2.
3. **`011_heat_awards.sql`** — CREATE TABLE `heat_awards (id, heat_id, athlete_id, division_id, raw_score, accuracy_pct, percentile, award_level, created_at)`.
4. **`012_division_curricula.sql`** — CREATE TABLE `division_curricula (id, division_id, course_id, created_at, UNIQUE(division_id, course_id))`.
5. **`013_curriculum_full_seed.sql`** — bulk-seed the remaining ~106 atomic_concepts from `docs/NC_Math_1.json` and the remaining 49 question_generators rows from `src/lib/competition/generators.ts`.
6. **`014_heat_participations_rename.sql`** — decide whether to rename `questions_attempted → questions_answered`, `ranking_points_earned → total_points`, `accuracy_score → accuracy`, `total_time_ms → avg_time_ms` (with computed semantics), `finished_at → completed_at`. Touches many call sites — coordinate with the engine sprint.
7. **`015_drop_broadcast_heats_policy.sql`** — drop the dangling RLS policy on `heats` that references the nonexistent `broadcast_heats` table (or create the `broadcast_heats` table).

---

## 15. Appendix — files inspected for this audit

- `supabase/mathathlone-schema.sql` (base / v1)
- `supabase/migrations/000_preflight_rename_legacy.sql`
- `supabase/migrations/002_league_system.sql`
- `supabase/migrations/003_integrity_system.sql`
- `supabase/migrations/004_nc_math_1_seed.sql`
- `supabase/migrations/005_views_and_functions.sql`
- `supabase/migrations/006_auth_v2_schema.sql`
- `supabase/migrations/006_league_engine.sql`
- `supabase/migrations/007_auth_v2_rls.sql`
- `supabase/migrations/007_identity_fields.sql`
- `supabase/migrations/008_auth_v2_seed.sql`
- `supabase/migrations/008_fix_rls_recursion.sql`
- `002_league_system_SAFE.sql` (root of repo — duplicate of 002 with extra UNIQUE constraints)
- `003_integrity_system.sql` (root of repo — duplicate of `supabase/migrations/003_integrity_system.sql`)
- `src/lib/competition/generators.ts` (54-entry `GENERATORS` registry)
- `docs/NC_Math_1.json` (111 atomic concepts across 8 unit topics)
- `docs/MATHATHLONE_OPEN_PLATFORM_VISION.md` (defines `is_global / division_code / auto_scheduled`)

Supabase CLI authentication state at audit time: logged in to organizations `bswxoxrpknxlxcshtjsp`, `ljlxrxqjxootrjtxhmvt`, `ovacrmjmxckjvmfsjokg`, `pwcipgznumcepjicyqnd`. Project ref `yhqxxgqfpgcertsqibps` (the one in `.env.local`) is **not in this account's project list**. Direct SQL execution against the live DB was therefore not possible in this sprint; the queries in Section 12 must be run manually in the SQL Editor.
