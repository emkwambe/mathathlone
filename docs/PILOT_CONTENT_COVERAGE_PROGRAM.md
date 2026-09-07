# Pilot Content Coverage and Audit Program

## Purpose

This record defines how MathAthlone will close course-content gaps before broader pilot use. It is a planning and release-gate record, not a new teacher-facing feature. A selectable atomic concept is not classroom-ready merely because it appears in a course catalogue.

The program follows the deterministic-first policy. Atomic-concept labels, question sources, answer construction, coverage classification, audit status, scoring, eligibility, and Heat behavior are deterministic and traceable. AI has no role in these functions.

## Coverage Rule

Each atomic concept must have an intentionally approved student-question source before it can be included in a classroom worksheet or a class-bound Heat. A source is valid only when it is mapped to the specific atomic concept and meets its own verification requirements.

| Source type | Appropriate concept nature | Minimum coverage evidence | Additional release evidence |
|---|---|---|---|
| Procedural generator | Computation, algorithm, symbolic manipulation, or parameterized application | Active `question_generators` mapping whose `generator_type` is implemented in the deterministic source registry | Deterministic mathematical-invariant tests; prompt-to-answer checks; qualified educator review |
| Static item | Definition, meaning, representation, explanation, recognition, or misconception | Active `static_questions` item mapped by its `concept_id` lesson-number contract | Mathematical accuracy, distractor validity, readable wording, and qualified educator review |
| Visual item | Diagram-essential or graph-essential task | Explicit one-to-one atomic-concept mapping, plus a versioned visual generator/item | Render review, mathematical accuracy, accessibility, and qualified educator review |
| Unavailable | Any concept without a valid source above | No usable mapped source | Excluded from worksheet and Heat selection until implemented and audited |

An active database row is not by itself enough. The corresponding implementation must exist, be mapped to the intended atomic concept, and pass deterministic validation. A generic visual generator without an explicit atomic-concept mapping is unavailable for an explicit concept selection.

## Scope and Audit Principles

Coverage is assessed by bounded, curriculum-coherent scopes rather than whole-course claims. A scope may contain procedural, conceptual static, and visual items together if each item has a valid source type and the scope is pedagogically coherent. A source-level audit can establish that a scope is calibrated, but it cannot replace qualified educator sign-off or controlled production worksheet/Heat acceptance.

| Status | Meaning | Classroom-ready claim allowed? |
|---|---|---|
| Inventory only | Source availability has been measured; no accuracy audit conclusion | No |
| Coverage remediation in progress | Missing or mismapped sources are being implemented or corrected | No |
| Source-calibrated | Deterministic source and mathematical checks have passed | No; educator and production gates may remain |
| Qualified educator reviewed | A qualified educator has reviewed the defined sample/evidence set | No, unless production acceptance is also complete |
| Production accepted | Classroom worksheet/PDF and class-bound Heat behavior passed controlled acceptance | Only for the exact recorded scope, subject to all policy gates |

## Immediate Program Order

The first program task is a complete live inventory of every selector-visible atomic concept by valid procedural, static, visual, or unavailable coverage. The inventory must distinguish an unimplemented generator mapping from a legitimate static conceptual item. It must also identify static-question records that require audit rather than treating their existence as approval.

Known Grade 6 records `MA-QCBU`, `MA-KYXS`, and `MA-SRE7` remain cancelled, unstarted, zero-participant audit records. They are not content sources and do not establish classroom acceptance. The strict explicit-concept Heat safeguard remains required: an explicit selected-concept scope must never admit an unmapped visual question.

The Grade 7 rational addition/subtraction scope remains source-remediated but not classroom-ready. Its corrected contextual generator is mapped to the real-world application concept `M7.NS.4.1`; qualified Grade 7 educator review and later controlled production acceptance remain required.

## Inventory Output Required

The authoritative live inventory will produce, for every course and topic, the count of atomic concepts that have: implemented procedural coverage; active static coverage; explicitly mapped visual coverage; no valid source; and source coverage pending mathematical or educator audit. The resulting worklist will be ordered by instructional coherence, student value, missing-source severity, and audit effort—not merely by total concept count.

## No-Waiver Rule

A demonstrated mathematical error, answer/prompt mismatch, incorrect atomic-concept mapping, out-of-scope Heat question, missing valid source, or unauditable visual mapping halts the affected scope. The issue is corrected, deterministically tested, and re-reviewed before the scope can advance. No content is publicly or classroom-released on the basis of an incomplete audit.

## References

This program applies the repository’s `DETERMINISTIC_FIRST_CONTENT_AND_ANALYTICS_POLICY.md`, `PILOT_CONTENT_AUDIT_REFERENCE_CHECKLISTS.md`, and scope-specific audit records. It does not make an external curriculum-alignment claim beyond those records.

## Grade 6 source locations

The Grade 6 coverage audit will use the North Carolina Department of Public Instruction mathematics standards resource hub as its official source location: <https://www.dpi.nc.gov/districts-schools/classroom-resources/office-teaching-and-learning/standard-course-study/mathematics/standard-course-study-supporting-resources>. The audit team may also consult the official NCDPI released Grade 6 mathematics form at <https://www.dpi.nc.gov/documents/accountability/testing/eog/eog-mathematics-grade-6-released-form/open>. These sources support calibration and review; they do not waive qualified-educator review or controlled production acceptance.
