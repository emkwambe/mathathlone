# Sprint 17 — Roster Operations Rollout and Acceptance Guide

**Purpose:** This guide releases the complete classroom roster workflow safely. Sprint 17 replaces the first-pass direct importer with a review-and-confirm process, controlled enrollment lifecycle actions, one-time credential handling, active-roster Heat safeguards, and an append-only operational audit record.

> **Release order is mandatory.** Publish the code first, apply migration `051` in Supabase second, verify the migration third, and deploy the website fourth. Do not use the roster screen until all four steps are complete.

## What Sprint 17 changes

| Area | Sprint 17 behavior | Safety boundary |
|---|---|---|
| Managed Mathlete identity | Uses `users.managed_username` as the canonical marker. | It does not recreate the absent legacy `users.managed` column. |
| Roster import | Teacher pastes privacy-safe display names, reviews the result, then confirms. | Review creates no account, enrollment, or PIN. |
| New credentials | Only confirmed new managed Mathletes receive a username and one-time temporary PIN. | PINs are not written to `users`, `class_enrollments`, `roster_operations`, Git, chat, or shared screenshots. |
| Existing identities | A teacher may add an existing same-school managed Mathlete by managed username. | The action never reveals or changes a PIN. |
| Enrollment lifecycle | Active enrollments may be removed and later restored; identities are never deleted. | Changes are blocked while a class Heat is scheduled, in the lobby, or open. |
| Class lifecycle | Active duplicate names for the same teacher/school are blocked; a class may be archived. | Archiving is also blocked while a class Heat is mutable. |
| Heat readiness | Class counts reflect only active enrollments. | Removed students cannot satisfy the Heat Builder’s roster requirement. |
| Audit record | `roster_operations` records safe operation metadata. | Only the server role can read/write it; credential values and raw student-name lists are excluded. |

## Step 1 — Publish the code patch to GitHub

### Action

Apply the supplied Sprint 17 implementation patch to the local `main` branch, run the local TypeScript check, and push the resulting commit to GitHub. Do **not** run `vercel --prod` yet.

### Location and object

Use **PowerShell** in `C:\Users\HP\Documents\mathathlone-app`. The object is the supplied Sprint 17 implementation patch.

### Expected result

Git reports one new implementation commit on `main` and `npx tsc --noEmit` returns with no TypeScript error. GitHub `main` then contains migration file `supabase/migrations/051_sprint17_roster_operations.sql`.

### If something differs

If `git am`, TypeScript, or `git push` reports an error, stop and share the exact non-secret error. Do not use `git am --continue`, `--skip`, `--abort`, force push, or deployment commands until the error is reviewed.

## Step 2 — Apply migration 051 in Supabase

### Action

In **Supabase Dashboard → SQL Editor → New query**, open `supabase/migrations/051_sprint17_roster_operations.sql` from the local repository, copy its entire contents, and select **Run** once.

### Location and object

The object is the additive database migration `051_sprint17_roster_operations.sql`. It creates the restricted `roster_operations` audit table and verifies/enforces one enrollment row per `(class_id, athlete_id)` pair.

### Expected result

Supabase returns **Success. No rows returned.** The migration creates no Mathlete identity, class, roster enrollment, Heat, username, or PIN.

### Stop conditions

| Result | Required response |
|---|---|
| `Cannot apply Sprint 17 roster integrity: duplicate class enrollment rows already exist` | Stop. Do not edit or delete any row. Share only the error. |
| Permission or relation error | Stop. Share the error. Do not change grants, policies, or schema manually. |
| Any other SQL error | Stop. Do not retry or partially re-run the script. Share the entire non-secret error. |

## Step 3 — Verify migration 051 without changing data

Run the following **read-only** query in Supabase SQL Editor. It does not expose credentials or change any record.

```sql
SELECT
  to_regclass('public.roster_operations') IS NOT NULL AS roster_operations_table_exists,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'class_enrollments'
      AND indexname = 'idx_class_enrollments_class_athlete_unique'
  ) AS enrollment_uniqueness_index_exists,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'roster_operations'
  ) AS audit_table_has_rls_policy;
```

| Expected field | Expected value |
|---|---|
| `roster_operations_table_exists` | `true` |
| `enrollment_uniqueness_index_exists` | `true` |
| `audit_table_has_rls_policy` | `false` — application clients have no direct policy; the server uses its secret-key role after authorization. |

If any expected value differs, stop before deployment and report the result. Do not attempt a roster import.

## Step 4 — Deploy only after migration verification

### Action

Run the production deployment from the local repository only after Steps 1–3 pass.

```powershell
vercel --prod
```

### Expected result

Vercel reports `✓ Ready` and aliases `https://mathathlone.vercel.app`. This deployment activates the new user interface and server routes. It does not itself create students or roster anyone.

## Step 5 — Controlled DEMO acceptance test

Use only **DEMO Northstar Grade 6 — Period 1** in the first test. Keep all usernames and temporary PINs private. Do not take or share screenshots that contain them.

| Order | Teacher action | Expected result | Stop / if-then rule |
|---|---|---|---|
| 1 | Sign in as the DEMO Northstar Grade 6 teacher and open **Classes & Roster**. | The single DEMO class shows **0 active**. | If another class or active roster appears, stop and report only counts/statuses. |
| 2 | Paste four privacy-safe names and select **Review roster before creating accounts**. | Four `New account` review rows; no credential panel. | If review creates a card, student, or error, stop. |
| 3 | Confirm the reviewed four rows once. | Exactly four active roster entries and four one-time private cards. | If count differs, do not retry; record the non-secret notice. |
| 4 | Print/secure the cards and select **I secured the cards**. | Cards disappear; active roster remains four. | Never send card details or PINs. |
| 5 | Re-submit the same four display names for review. | All four show `already active`; confirmation issues no new card. | If it proposes a duplicate account, stop. |
| 6 | Remove one controlled Mathlete and verify the active count becomes three; restore the same student and verify four. | Identity remains visible under removed/active status; no PIN is revealed. | Do not do this after creating a class-bound Heat. |
| 7 | Reset one selected managed Mathlete PIN. | One replacement card appears; old PIN is invalidated. | Do not test the old PIN or share either PIN. |
| 8 | Create a short class-bound Grade 6 practice Heat. | Heat Builder recognizes the class has four active Mathletes. | Do not modify, remove, restore, or archive the roster while the Heat is scheduled, lobby, or open. |
| 9 | Attempt a roster change during that mutable Heat. | The action is denied with a safe explanation. | Do not bypass the denial through database tools. |
| 10 | Complete/cancel the Heat, then conduct the existing worksheet/PDF/fresh-instance/non-rostered-admission acceptance flow. | Existing acceptance sequence resumes. | Record sanitized evidence only. |

## Completion boundary

Sprint 17 is **operationally accepted** only after migration verification and all controlled acceptance tests pass. It does not close the separate Grade 6 or NC Math 1 qualified-educator content-review gates, and it does not authorize real-school onboarding.

## References

[1]: SPRINT_17_ROSTER_OPERATIONS_PLAN.md "Sprint 17 — Classroom Roster Operations and Managed Mathlete Lifecycle"
[2]: PILOT_GUIDES/02_TEACHER_CLASSROOM_GUIDE.md "Guide 2 — Teacher Classroom Guide"
[3]: ../supabase/migrations/051_sprint17_roster_operations.sql "Sprint 17 additive roster operations migration"
[4]: ../src/lib/classrooms/managed-roster.ts "Canonical managed-Mathlete service"

---

**Prepared by:** Manus AI

**Release status:** Implementation candidate; migration and production acceptance remain pending.
