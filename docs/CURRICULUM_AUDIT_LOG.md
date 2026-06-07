# MathAthlone — Curriculum Coverage Audit Log
**Generated:** June 6, 2026 | **Mpingo Systems LLC**

This is the living audit document mapping every atomic concept across all 9 pools to its question coverage.
Use this log for: gap analysis, rigor audits, EOG alignment checks, pivot identification, and sprint planning.

---

## How to Read This Log

Each concept row shows:
- **Concept ID** — lesson_number (e.g. M7.NS.1.2)
- **Gen** — number of procedural generators (FR questions, 2× CTA weight)
- **Static** — number of MC static questions
- **SVG** — number of visual generators
- **DB Gen** — whether generator is seeded to question_generators table
- **DB Static** — whether static question is seeded to static_questions table
- **Gap flags** — auto-detected coverage gaps

### Gap Flag Legend
- `❌ NO_COVERAGE` — concept has no questions of any type
- `⚠️ STATIC_ONLY` — only MC questions, no FR generator
- `⚠️ GEN_ONLY` — generator exists but no MC questions
- `⚠️ NOT_IN_DB` — content exists in JSON but not seeded to DB
- `✅ FULL` — has both generator and static questions in DB
- `🔷 PARTIAL` — has one type in DB

---

## Summary Dashboard

| Course | Division | Grade | Concepts | Gens (JSON) | Gens (DB) | Static (DB) | SVGs | Coverage |
|---|---|---|---|---|---|---|---|---|
| MF | Foundation | 6-8 | 105 | 90 | 0 | 49 | 0 | 🔷 MC only |
| G6 | Rising Stars | 6 | 41 | 41 | 0 | 33 | 0 | 🔷 MC only |
| G7 | Challengers | 7 | 50 | 33 | 25 | 27 | 0 | ✅ FR + MC |
| G8 | Contenders | 8 | 54 | 32 | 25 | 27 | 0 | ✅ FR + MC |
| ALG1 | Varsity | 8-9 | 30 | 0 | 25 | 32 | 0 | ✅ FR + MC |
| NCM2 | Junior Varsity | 9-10 | 128 | 82 | 0 | 78 | 0 | 🔷 MC only |
| NCM3 | Senior Varsity | 10-11 | 72 | 57 | 0 | 29 | 0 | 🔷 MC only |
| ALG2 | Senior Varsity | 10-11 | 182 | 182 | 0 | 50 | 0 | 🔷 MC only |
| APPC | Senior Varsity | 11-12 | 37 | 37 | 0 | 72 | 0 | 🔷 MC only |
| **TOTAL** | | | **699** | **554** | **75** | **397** | **0** | |

---

## MF — Math Fundamentals
**Division:** Foundation | **Grade Band:** 6-8
**Generators in DB:** 0 | **Static Questions in DB:** 49 | **SVGs in DB:** 0

| Concept ID | Gen (JSON) | Static (JSON) | SVG | DB Gen | DB Static | Flag |
|---|---|---|---|---|---|---|
| MF.ANT.1.1 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.ANT.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ANT.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ANT.1.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ANT.1.5 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ANT.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.ANT.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ANT.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ANT.2.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ANT.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.ANT.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.ANT.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.AP.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.AP.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.AP.3.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.AP.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.AP.5.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.AP.5.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.AP.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ER.1.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.ER.1.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.ER.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ER.1.5 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.ER.1.6 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.ER.1.7 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ER.2.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.ER.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.ER.2.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FB.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FB.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FB.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FB.1.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FB.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FB.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FB.3.1 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.FB.3.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.FB.3.4 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.FB.3.5 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.FDP.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FDP.1.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.FDP.1.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.FDP.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FDP.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.FDP.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FDP.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.FDP.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FDP.4.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FDP.4.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FDP.5.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.FDP.5.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.FDP.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.FDP.6.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.GEO.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.GEO.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.GEO.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.GEO.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.GEO.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.GEO.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.GEO.2.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.GEO.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.GEO.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.GEO.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.RAD.1.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.RAD.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.RAD.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.RAD.2.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.RAD.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.RAD.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.RAD.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.RAD.3.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.RAD.4.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.RAD.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.RPBA.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.RPBA.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.RPBA.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.RPBA.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.RPBA.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.RPBA.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.RPBA.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.S.1.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.S.1.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.S.1.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.S.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.S.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.S.3.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.S.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.S.3.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.S.3.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.SETS.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.SETS.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.SETS.2.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.SETS.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.SETS.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.SETS.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.SETS.4.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.UC.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.UC.1.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.UC.1.6 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.UC.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.UC.2.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.UC.2.6 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.UC.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| MF.UC.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| MF.UC.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| MF.UC.3.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |

**Gap Summary:** ✅ Full=0 | 🔷 Partial=32 | ⚠️ Static-only=15 | ⚠️ Gen-only=58 | ❌ No coverage=0 | ⚠️ Not in DB=0

---

## G6 — NC Grade 6 Math
**Division:** Rising Stars | **Grade Band:** 6
**Generators in DB:** 0 | **Static Questions in DB:** 33 | **SVGs in DB:** 0

| Concept ID | Gen (JSON) | Static (JSON) | SVG | DB Gen | DB Static | Flag |
|---|---|---|---|---|---|---|
| M6.EE.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.EE.1.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.EE.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.EE.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.EE.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.EE.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.EE.5.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.GEO.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.GEO.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.GEO.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.GEO.1.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.GEO.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.GEO.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.GEO.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.GEO.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.GEO.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.GEO.4.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.1.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.4.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.4.5 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.4.6 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.NS.4.7 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.RP.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.RP.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.RP.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.RP.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.RP.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.RP.3.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.RP.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.SP.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.SP.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.SP.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M6.SP.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |

**Gap Summary:** ✅ Full=0 | 🔷 Partial=0 | ⚠️ Static-only=0 | ⚠️ Gen-only=41 | ❌ No coverage=0 | ⚠️ Not in DB=0

---

## G7 — NC Grade 7 Math
**Division:** Challengers | **Grade Band:** 7
**Generators in DB:** 25 | **Static Questions in DB:** 27 | **SVGs in DB:** 0

| Concept ID | Gen (JSON) | Static (JSON) | SVG | DB Gen | DB Static | Flag |
|---|---|---|---|---|---|---|
| M7.EE.1.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.EE.1.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.EE.1.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.EE.2.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.EE.2.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.EE.2.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.EE.3.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.EE.3.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.GEO.1.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.GEO.1.2 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.GEO.1.3 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.GEO.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.GEO.2.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.GEO.2.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.GEO.3.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.GEO.3.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.GEO.4.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.GEO.4.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.GEO.4.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.GEO.4.4 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.NS.1.1 | 0 | 3 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.NS.1.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.NS.1.3 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.NS.1.4 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.NS.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.NS.2.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.NS.2.3 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.NS.2.4 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.NS.3.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.NS.4.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.RP.1.1 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.RP.1.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.RP.1.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.RP.1.4 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.RP.2.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.RP.3.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.RP.3.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.RP.3.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.RP.3.4 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.RP.4.1 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.RP.4.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.SP.1.1 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.SP.2.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.SP.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.SP.3.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.SP.3.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.SP.3.4 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.SP.4.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M7.SP.4.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M7.SP.4.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |

**Gap Summary:** ✅ Full=0 | 🔷 Partial=0 | ⚠️ Static-only=17 | ⚠️ Gen-only=33 | ❌ No coverage=0 | ⚠️ Not in DB=0

---

## G8 — NC Grade 8 Math
**Division:** Contenders | **Grade Band:** 8
**Generators in DB:** 25 | **Static Questions in DB:** 27 | **SVGs in DB:** 0

| Concept ID | Gen (JSON) | Static (JSON) | SVG | DB Gen | DB Static | Flag |
|---|---|---|---|---|---|---|
| M8.EE.1.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.EE.2.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.EE.2.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.EE.2.3 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.EE.3.1 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.EE.3.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.EE.3.4 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.EE.3.5 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.F.1.1 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.F.1.4 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.F.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.F.2.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.F.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.F.3.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.F.3.3 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.F.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.GEO.PV.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.GEO.PV.1.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.PV.1.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.PV.1.4 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.PV.1.5 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.PV.2.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.PV.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.GEO.PV.3.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.PV.3.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.GEO.PV.3.4 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.PV.3.5 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.GEO.PV.3.6 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.PV.4.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.TRANS.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.GEO.TRANS.1.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.TRANS.1.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.TRANS.1.4 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.TRANS.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.GEO.TRANS.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.GEO.TRANS.3.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.TRANS.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.GEO.TRANS.5.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.TRANS.5.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.GEO.TRANS.6.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.NS.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.NS.1.2 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.NS.1.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.NS.2.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.NS.2.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.NS.2.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.NS.3.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.NS.3.3 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.SP.1.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.SP.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.SP.2.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.SP.2.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M8.SP.3.1 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |
| M8.SP.3.2 | 1 | 0 | 0 | ✅ | ❌ | ⚠️ GEN_ONLY |

**Gap Summary:** ✅ Full=0 | 🔷 Partial=0 | ⚠️ Static-only=22 | ⚠️ Gen-only=32 | ❌ No coverage=0 | ⚠️ Not in DB=0

---

## ALG1 — Algebra 1
**Division:** Varsity | **Grade Band:** 8-9
**Generators in DB:** 25 | **Static Questions in DB:** 32 | **SVGs in DB:** 0

| Concept ID | Gen (JSON) | Static (JSON) | SVG | DB Gen | DB Static | Flag |
|---|---|---|---|---|---|---|
| Alg1.DAS.2.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.DAS.4.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.DAS.4.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.DAS.5.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.DAS.5.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.EXP.1.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.EXP.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.EXP.2.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FLF.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FLF.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FLF.2.4 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FLF.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FLF.4.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FLF.6.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FND.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FND.1.4 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FND.2.7 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FND.3.1 | 0 | 2 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FND.5.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.FND.5.5 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.POLY.2.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.POLY.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.POLY.5.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.POLY.6.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.QUAD.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.QUAD.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.QUAD.2.4 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.QUAD.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.SYS.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| Alg1.SYS.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |

**Gap Summary:** ✅ Full=0 | 🔷 Partial=0 | ⚠️ Static-only=30 | ⚠️ Gen-only=0 | ❌ No coverage=0 | ⚠️ Not in DB=0

---

## NCM2 — NC Math 2
**Division:** Junior Varsity | **Grade Band:** 9-10
**Generators in DB:** 0 | **Static Questions in DB:** 78 | **SVGs in DB:** 0

| Concept ID | Gen (JSON) | Static (JSON) | SVG | DB Gen | DB Static | Flag |
|---|---|---|---|---|---|---|
| M2.APR.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.APR.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.APR.1.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.APR.2.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.APR.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.APR.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.APR.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.APR.3.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.APR.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.APR.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.APR.4.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.APR.4.4 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.BF.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.BF.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.BF.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.BF.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.BF.2.4 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.BF.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.BF.3.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.BF.3.4 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.CE.1.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.CE.1.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.CE.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.CE.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CE.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.CE.4.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.CE.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CIR.1.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.CIR.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CIR.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.CIR.2.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CIR.2.5 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.CIR.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CIR.3.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.CIR.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CIR.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CIR.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CIR.5.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.CN.1.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.CN.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CN.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CN.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.CN.2.4 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.CN.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.CN.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.GEO.CON.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.GEO.CON.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.GEO.CON.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.GEO.CON.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.GEO.CON.4.1 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.GEO.CON.4.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.GEO.CON.5.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.GEO.CON.5.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.GEO.CON.6.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.GEO.CON.6.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.GEO.CON.7.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.IF.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.IF.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.IF.1.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.IF.2.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.IF.3.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.IF.3.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.IF.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.IF.5.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.IF.6.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.PROB.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.PROB.1.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.PROB.1.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.PROB.2.1 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.PROB.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.PROB.2.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.PROB.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.PROB.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.PROB.4.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.PROB.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.PROB.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.PROB.5.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.PROB.5.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.PROB.5.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.REI.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.REI.2.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.REI.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.REI.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.REI.4.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.REI.5.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.REI.6.1 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.REI.6.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.REI.7.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.REI.7.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.REI.8.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.RNS.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.RNS.1.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.RNS.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.RNS.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.RNS.3.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.RNS.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.RNS.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.RNS.3.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.RNS.3.5 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.RNS.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.RNS.4.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.RNS.4.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.SRT.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.SRT.1.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.SRT.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.SRT.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.SRT.3.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.SRT.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.SRT.4.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.SRT.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.SRT.5.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.SRT.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.SRT.6.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.SRT.7.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.SRT.7.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.SRT.8.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.SRT.9.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.SSE.1.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.SSE.2.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.SSE.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.SSE.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.STATS.1.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.STATS.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.STATS.2.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.STATS.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M2.STATS.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M2.STATS.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M2.STATS.5.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |

**Gap Summary:** ✅ Full=0 | 🔷 Partial=29 | ⚠️ Static-only=46 | ⚠️ Gen-only=53 | ❌ No coverage=0 | ⚠️ Not in DB=0

---

## NCM3 — NC Math 3
**Division:** Senior Varsity | **Grade Band:** 10-11
**Generators in DB:** 0 | **Static Questions in DB:** 29 | **SVGs in DB:** 0

| Concept ID | Gen (JSON) | Static (JSON) | SVG | DB Gen | DB Static | Flag |
|---|---|---|---|---|---|---|
| M3.CIR.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.CIR.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.EL.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.EL.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.EL.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.EL.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.EL.4.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.EL.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.EL.4.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.EL.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.EL.5.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.EL.6.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.EL.6.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.EL.8.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.EL.8.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.FNI.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.FNI.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.FNI.1.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.FNI.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.FNI.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.FNI.3.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.FNI.3.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.FNI.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.FNI.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.FNI.4.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.FNI.4.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.FNI.4.5 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.FNI.5.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.GEO.CIR.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.GEO.CIR.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.GEO.CIR.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.GEO.CIR.2.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.GEO.CIR.3.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.GEO.CIR.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.1.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.PR.1.3 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.PR.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.2.4 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.PR.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.3.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.PR.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.5.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.5.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.5.4 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.PR.6.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.PR.6.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PR.6.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PS.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PS.2.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.PS.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PS.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PS.3.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.PS.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.PS.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.PS.5.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.PS.5.2 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.TRIG.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.TRIG.1.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.TRIG.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.TRIG.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.TRIG.2.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.TRIG.4.1 | 0 | 1 | 0 | ❌ | ✅ | ⚠️ STATIC_ONLY |
| M3.TRIG.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.TRIG.5.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.TRIG.6.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.TRIG.7.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| M3.TRIG.7.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| M3.TRIG.8.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |

**Gap Summary:** ✅ Full=0 | 🔷 Partial=14 | ⚠️ Static-only=15 | ⚠️ Gen-only=43 | ❌ No coverage=0 | ⚠️ Not in DB=0

---

## ALG2 — Algebra 2
**Division:** Senior Varsity | **Grade Band:** 10-11
**Generators in DB:** 0 | **Static Questions in DB:** 50 | **SVGs in DB:** 0

| Concept ID | Gen (JSON) | Static (JSON) | SVG | DB Gen | DB Static | Flag |
|---|---|---|---|---|---|---|
| Alg2.ADVQUAD.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.ADVQUAD.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.ADVQUAD.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.ADVQUAD.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.ADVQUAD.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.ADVQUAD.2.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.ADVQUAD.3.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.ADVQUAD.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.ADVQUAD.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.ADVQUAD.4.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.ADVQUAD.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.ADVQUAD.5.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.ADVQUAD.5.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.ADVQUAD.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CN.1.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.CN.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CN.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CN.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CN.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.CN.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CN.2.4 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.CN.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CN.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.CONIC.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.2.4 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.CONIC.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.3.4 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.CONIC.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.4.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.CONIC.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.5.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.5.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.CONIC.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.7.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.CONIC.8.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.CONIC.8.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.3.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.EL.4.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.EL.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.4.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.5.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.EL.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.6.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.EL.7.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.EL.8.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.EL.8.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.1.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.FT.1.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.FT.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.1.4 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.FT.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.2.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.FT.2.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.FT.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.3.4 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.FT.3.5 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.5.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.5.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.5.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.FT.5.5 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.FT.5.6 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.3.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.MAT.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.4.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.5.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.MAT.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.6.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.7.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.MAT.8.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.1.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.POLY.1.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.POLY.1.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.2.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.POLY.2.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.4.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.POLY.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.5.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.POLY.5.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.POLY.7.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.POLY.8.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.2.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.PS.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.4.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.PS.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.5.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.PS.5.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.5.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.6.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.PS.7.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.PS.7.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.PS.8.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.PS.8.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.1.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.RAD.1.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.6.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.RAD.7.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.7.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.8.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.RAD.8.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAD.8.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.RAD.9.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.1.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.RAT.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.2.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.3.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.4.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.RAT.4.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.RAT.4.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.4.4 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.6.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.RAT.6.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.RAT.7.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.1.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.1.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.2.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.2.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.SEQ.2.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.3.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.3.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.4.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.4.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.4.3 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.5.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.5.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.SEQ.6.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.6.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Alg2.SEQ.7.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.7.2 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.8.1 | 1 | 0 | 0 | ❌ | ❌ | ⚠️ GEN_ONLY |
| Alg2.SEQ.8.2 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |

**Gap Summary:** ✅ Full=0 | 🔷 Partial=50 | ⚠️ Static-only=0 | ⚠️ Gen-only=132 | ❌ No coverage=0 | ⚠️ Not in DB=0

---

## APPC — AP Precalculus
**Division:** Senior Varsity | **Grade Band:** 11-12
**Generators in DB:** 0 | **Static Questions in DB:** 72 | **SVGs in DB:** 0

| Concept ID | Gen (JSON) | Static (JSON) | SVG | DB Gen | DB Static | Flag |
|---|---|---|---|---|---|---|
| Pre.1.1 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.10 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.11 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.12 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.13 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.14 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.2 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.3 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.4 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.5 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.6 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.7 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.8 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.1.9 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.2.1 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.2.11 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.2.13 | 1 | 3 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.2.15 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.2.2 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.2.3 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.2.4 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.2.7 | 1 | 3 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.2.8 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.2.9 | 1 | 3 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.3.1 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.3.12 | 1 | 5 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.3.13 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.3.14 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.3.2 | 1 | 3 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.3.4 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.3.6 | 1 | 3 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.3.9 | 1 | 3 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.4.1 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.4.10 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.4.12 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.4.6 | 1 | 2 | 0 | ❌ | ✅ | 🔷 PARTIAL |
| Pre.4.8 | 1 | 1 | 0 | ❌ | ✅ | 🔷 PARTIAL |

**Gap Summary:** ✅ Full=0 | 🔷 Partial=37 | ⚠️ Static-only=0 | ⚠️ Gen-only=0 | ❌ No coverage=0 | ⚠️ Not in DB=0

---

## Audit Checklist — Per Concept

For each atomic concept, a complete quality review requires:

### Rigor
- [ ] Generator covers the full difficulty range (DOK 1-3)
- [ ] Static question targets a specific misconception
- [ ] Answer type matches expected student output
- [ ] Format hint is unambiguous and doesn't leak the answer

### Relevance
- [ ] Concept appears in NC state standards or AP framework
- [ ] Question context matches grade-level appropriateness
- [ ] Real-world generators use varied, culturally relevant scenarios

### EOG/AP Alignment
- [ ] Concept weight matches EOG domain percentage
- [ ] DOK level matches EOG item distribution
- [ ] Vocabulary matches state-released item language

### Technical
- [ ] Generator produces no degenerate cases (verified)
- [ ] Answer validation handles all equivalent forms
- [ ] Unit of measurement handled correctly (Option B pending)

---

## Pivot Opportunities

Concepts flagged here represent curriculum expansion or redesign opportunities:

| Opportunity | Concepts | Action |
|---|---|---|
| Unit-of-measurement hint (Option B) | G7/G8 geometry generators | Add unit to answer_type validation |
| Visual generators (Phase 3) | 119 concepts across all pools | Build SVG generators from *_visual.json specs |
| 3-axis tagging in DB | All 699 concepts | Add cognitive_demand, complexity, context columns |
| EOG item analysis | G6, G7, G8 | Map released items to atomic concepts |
| AP alignment | APPC | Map College Board topic outlines to generators |
| Cross-division MF generators | 90 MF concepts | Build Foundation generators for diagnostic heats |

---

*Last updated: June 6, 2026 | Mpingo Systems LLC — Precision Tools built to stay.*