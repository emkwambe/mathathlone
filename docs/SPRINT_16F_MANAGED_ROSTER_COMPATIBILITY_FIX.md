# Sprint 16F — Managed Roster Schema Compatibility Fix

**Status:** Implemented locally; validation and deployment pending.

## Incident observed during the controlled DEMO test

The `DEMO Northstar Grade 6 — Period 1` class was created successfully, but its first roster-import attempt returned:

> `column users_1.managed does not exist`

The roster remained empty, the response reported zero Mathletes added, and no temporary PIN was created or exposed. The error was therefore contained before student account enrollment.

## Root cause

The Sprint 16C classroom migration, `048_sprint16c_class_rosters.sql`, defines **`public.users.managed_username`** as the managed classroom account identifier. The class roster API and console also queried and wrote a legacy **`public.users.managed`** flag, introduced in older migration `042_sprint9_district_roster.sql`. The production database has the current Sprint 16C username column but not the older Boolean column. This made the compatibility assumption invalid.

## Repair

The controlled classroom workflow now uses `managed_username IS NOT NULL` as its managed-account marker. This is the field deliberately defined by migration 048 and the field necessary for teacher-issued username/PIN access.

| Component | Change | Privacy/security effect |
|---|---|---|
| Roster import API | Removes `managed` from existing-profile reads, profile upserts, and nested roster reads. | Avoids the missing legacy column without weakening server-side class authorization. |
| Roster console | Treats a nonempty `managed_username` as a managed account for display and PIN-reset eligibility. | Shows no PIN after the one-time import response; teacher can still reset an individual managed account when needed. |
| Auth creation metadata | Unchanged. | Temporary PIN continues to exist only in Supabase Auth and is returned once for a newly created managed account. |
| Classes and Heat admission | Unchanged. | The existing `can_manage_class` and active `class_enrollments` checks remain authoritative. |

## No migration decision

A new database migration is **not required** for this repair. The production classroom contract already includes `managed_username` from migration 048. Requiring or re-running legacy migration 042 would also alter unrelated old district-standings behavior and is not the smallest safe correction.

## Controlled re-test

After deployment, use the existing `DEMO Northstar Grade 6 — Period 1` class. Do not create another class.

1. Confirm the class still shows **0 rostered**.
2. Submit four privacy-safe display names once.
3. Confirm four active roster entries and four private, one-time login cards.
4. Print or privately retain the cards before leaving the page; never place the temporary PINs in chat, repository files, screenshots, or public documentation.
5. If any enrollment count differs from four or an error returns, stop before launching a Heat.

## Non-goals

This correction does not change user roles, schools, RLS policies, the class-bound Heat gate, existing student records, or legacy district-league infrastructure.
