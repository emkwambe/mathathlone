# MathAthlone Hierarchical Seeding: Schema & RealityDB Spec

## 1. Schema Overview

The MathAthlone League Engine operates on a strict geographic and organizational hierarchy. To support proper upward advancement (seeding), we have expanded the schema to explicitly model this chain:

**Classroom $\rightarrow$ School $\rightarrow$ District $\rightarrow$ Region $\rightarrow$ State $\rightarrow$ National**

### New Tables (Migration `035_hierarchical_regions_seeding.sql`)

1. **`states`**
   - `code` (CHAR(2), PK) — e.g., 'NC'
   - `name` (TEXT) — e.g., 'North Carolina'
   - `country_code` (CHAR(2)) — Default 'US'

2. **`regions`**
   - `id` (UUID, PK)
   - `name` (TEXT) — e.g., 'Charlotte EOG', 'Triangle Region'
   - `state_code` (CHAR(2), FK)

3. **`districts`** (Existing table, altered)
   - Added `region_id` (UUID, FK) to link districts to regions.

4. **`leagues`** (Existing table, altered)
   - Updated `level` constraint to include: `'classroom'`, `'school'`, `'district'`, `'regional'`, `'state'`, `'national'`.

5. **`league_advancement`**
   - `id` (UUID, PK)
   - `source_league_id` (UUID, FK) — The lower-level league (e.g., Classroom).
   - `target_league_id` (UUID, FK) — The higher-level league (e.g., School).
   - `slots_allocated` (INTEGER) — How many top Mathletes advance (default 1).

---

## 2. RealityDB Data Generation Needs

To properly test the bracket generation, ELO rating updates, and championship advancement UI, we need RealityDB to generate a realistic, interconnected dataset that populates the entire chain from the bottom up.

Please configure RealityDB to generate synthetic data meeting the following specifications:

### Target Scale (The "North Carolina" Seed)
We want a deep, fully connected tree in a single state (North Carolina) to ensure brackets are fully populated at the upper levels.

*   **1 State**: North Carolina (`NC`)
*   **2 Regions**: "Charlotte Area" and "Triangle Area"
*   **4 Districts** (2 per Region): e.g., Charlotte-Mecklenburg, Union County, Wake County, Durham Public Schools
*   **16 Schools** (4 per District)
*   **64 Classrooms** (4 Math classes per School)
*   **1,024 Mathletes** (16 Mathletes per Classroom)

### Generation Steps & Relationships

RealityDB should generate the SQL `INSERT` statements (or direct API payloads) following this exact dependency order:

#### Step 1: Base Hierarchy (Locations & Organizations)
1. Insert State: `('NC', 'North Carolina', 'US')`
2. Insert 2 Regions linked to `NC`.
3. Insert 4 Districts linked to the 2 Regions.
4. Insert 16 Schools linked to the 4 Districts.

#### Step 2: Users (Teachers & Mathletes)
1. Insert 16 Teachers (1 per School, `role = 'teacher'`).
2. Insert 64 Classes (4 per Teacher/School).
3. Insert 1,024 Mathletes (`role = 'athlete'`).
4. Insert 1,024 Class Enrollments linking Mathletes to their respective Classes.

#### Step 3: Leagues (The Competition Tree)
Generate Leagues for the current active Season (`is_active = true`).
1. **64 Classroom Leagues** (`level = 'classroom'`).
2. **16 School Leagues** (`level = 'school'`).
3. **4 District Leagues** (`level = 'district'`).
4. **2 Regional Leagues** (`level = 'regional'`).
5. **1 State League** (`level = 'state'`).

#### Step 4: Advancement Paths (`league_advancement`)
This is the critical step for the League Engine to know how brackets feed into each other.
1. Map the 64 Classroom Leagues $\rightarrow$ their respective 16 School Leagues (`slots_allocated = 2`). *(Top 2 from each class advance to school).*
2. Map the 16 School Leagues $\rightarrow$ their respective 4 District Leagues (`slots_allocated = 4`). *(Top 4 from each school advance to district).*
3. Map the 4 District Leagues $\rightarrow$ their respective 2 Regional Leagues (`slots_allocated = 8`).
4. Map the 2 Regional Leagues $\rightarrow$ the 1 State League (`slots_allocated = 16`).

#### Step 5: Initial League Memberships
For the engine to function, the Mathletes must be registered in the lowest level of the pyramid.
1. Insert `league_memberships` for all 1,024 Mathletes into their respective **Classroom Leagues**.

*(Note: The MathAthlone League Engine code will automatically handle promoting Mathletes to the higher-level `league_memberships` when the lower-level brackets complete, based on the `league_advancement` table).*

---

## 3. Output Format

RealityDB should output a pure `.sql` seed file (e.g., `036_realitydb_nc_seed.sql`) containing standard PostgreSQL `INSERT INTO ... ON CONFLICT DO NOTHING` statements, utilizing `gen_random_uuid()` for IDs where necessary, or explicit UUIDs if it makes relational mapping easier for the generator.
