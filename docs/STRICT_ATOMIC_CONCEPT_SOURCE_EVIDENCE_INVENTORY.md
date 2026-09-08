# Strict Atomic-Concept Source-Evidence Inventory

> **Status:** Live read-only inventory; this is source evidence, not a classroom-readiness determination.

## Portfolio Summary

The inventory contains **854** selector-visible atomic concepts. Under the approved availability contract, **617 (72.2%)** are unavailable because they have either no approved active source or only active-but-unverified static items. Procedural mappings still require a runtime-registry check in the availability service before they may be treated as available.

| Strict source evidence state | Concepts | Interpretation |
|---|---:|---|
| Procedural + verified static | 2 | Multiple mapped source families; runtime generator implementation still must be confirmed. |
| Procedural mapping only | 234 | Database procedural mapping exists; runtime implementation must be confirmed. |
| Verified static only | 1 | May be available only after source-aware worksheet/Heat delivery supports the item. |
| Unverified static only | 285 | Unavailable until static-item verification is recorded. |
| No approved active source | 332 | Unavailable; needs a mapped source or explicitly staged source. |

## Course Summary

| Course | Total | Procedural + verified static | Procedural mapping | Verified static only | Unverified static only | No approved source | Unavailable |
|---|---:|---:|---:|---:|---:|---:|---:|
| ALG2 — Algebra 2 | 182 | 0 | 0 | 0 | 50 | 132 | 182 |
| MF — Math Fundamentals | 111 | 0 | 25 | 0 | 35 | 51 | 86 |
| NCM3 — NC Math 3 | 88 | 0 | 25 | 0 | 26 | 37 | 63 |
| NCM2 — NC Math 2 | 84 | 2 | 20 | 1 | 22 | 39 | 61 |
| NCM1 — NC Math 1 | 111 | 0 | 52 | 0 | 31 | 28 | 59 |
| ALG1 — Algebra 1 | 76 | 0 | 26 | 0 | 25 | 25 | 50 |
| APPC — AP Precalculus | 37 | 0 | 0 | 0 | 37 | 0 | 37 |
| G8 — NC Grade 8 Math | 54 | 0 | 25 | 0 | 22 | 7 | 29 |
| G6 — NC Grade 6 Math | 61 | 0 | 34 | 0 | 20 | 7 | 27 |
| G7 — NC Grade 7 Math | 50 | 0 | 27 | 0 | 17 | 6 | 23 |

## Highest-Gap Topics

| Course | Topic | Total | No approved source | Unverified-static only | Unavailable |
|---|---|---:|---:|---:|---:|
| ALG2 | ALG2.FUNCTIONST — Functions & Transformations | 21 | 14 | 7 | 21 |
| ALG2 | ALG2.CONICSECTI — Conic Sections | 20 | 15 | 5 | 20 |
| ALG2 | ALG2.PROBABILIT — Probability & Statistics | 20 | 14 | 6 | 20 |
| ALG2 | ALG2.POLYNOMIAL — Polynomial Functions | 18 | 12 | 6 | 18 |
| ALG2 | ALG2.SEQUENCESS — Sequences & Series | 18 | 14 | 4 | 18 |
| ALG2 | ALG2.EXPONENTIA — Exponential & Logarithmic Fns | 17 | 12 | 5 | 17 |
| NCM3 | NCM3.PR — M3.PR | 17 | 11 | 6 | 17 |
| ALG2 | ALG2.RADICALFUN — Radical Functions & Rational Exponents | 16 | 12 | 4 | 16 |
| ALG2 | ALG2.RATIONALFU — Rational Functions | 15 | 11 | 4 | 15 |
| ALG2 | ALG2.MATRICES — Matrices | 14 | 12 | 2 | 14 |
| ALG2 | ALG2.QUADRATICF — Quadratic Functions & Relations (Advanced) | 14 | 11 | 3 | 14 |
| APPC | APPC.POLYNOMIAL — Polynomial & Rational Functions | 14 | 0 | 14 | 14 |
| G8 | G8.GEO — Geometry | 24 | 4 | 8 | 12 |
| MF | MF.FDP — Fractions, Decimals & Percents | 15 | 5 | 6 | 11 |
| NCM1 | DAS — Data Analysis & Statistics | 14 | 6 | 5 | 11 |
| NCM2 | NCM2.PROBABILIT — Probability | 11 | 6 | 5 | 11 |
| NCM3 | NCM3.EL — M3.EL | 16 | 8 | 3 | 11 |
| APPC | APPC.EXPONENTIA — Exponential & Logarithmic Functions | 10 | 0 | 10 | 10 |
| MF | MF.FB — Foundations & Number Basics | 10 | 6 | 4 | 10 |
| MF | MF.UC — Unit Conversions & Measurement | 10 | 8 | 2 | 10 |
| NCM1 | GEO.TRANS — Geometric Transformations & Congruence | 14 | 6 | 4 | 10 |
| NCM3 | NCM3.FNI — Functions and Inverses | 15 | 6 | 4 | 10 |
| NCM3 | NCM3.TRIG — M3.TRIG | 13 | 3 | 7 | 10 |
| ALG2 | ALG2.COMPLEXNUM — Complex Number System | 9 | 5 | 4 | 9 |
| MF | MF.ANT — Arithmetic with Negative Numbers | 12 | 7 | 2 | 9 |
| MF | MF.RAD — Rational & Algebraic Reasoning | 10 | 6 | 3 | 9 |
| NCM1 | FLF — Functions & Linear Functions | 18 | 1 | 8 | 9 |
| NCM2 | NCM2.SIMILARITY — Similarity & Right Triangles | 9 | 9 | 0 | 9 |
| ALG1 | ALG1.DAS — Data Analysis & Statistics | 8 | 3 | 5 | 8 |
| ALG1 | ALG1.EXP — Exponents & Exponential Functions | 9 | 5 | 3 | 8 |

## Deterministic Follow-up

The availability service must perform the runtime-key check for every procedural mapping, classify verified static coverage separately, and keep unverified/static-less concepts disabled. This report does not infer visual availability because the application has no complete explicit visual-to-concept registry yet.

The detailed unavailable worklist is stored alongside this report as `STRICT_ATOMIC_CONCEPT_UNAVAILABLE_WORKLIST.json`.
