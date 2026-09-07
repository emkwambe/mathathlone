# Grade 6 Content-Gap Closure — Qualified Educator Review Guide

**Applies to:** `PILOT-NC6M-GAP-001` only
**Current state:** Seven source mappings are staged inactive; no student worksheet or Heat use is authorized.

## Purpose

This review determines whether the seven staged Grade 6 question sources are mathematically correct, appropriate for the named content, readable for students, and adequately represented. It does **not** authorize a broader Grade 6 course release. A single rejected item or ambiguous representation keeps the affected generator inactive until remediation and re-review.

The review set is stored at:

```text
docs/PILOT_CONTENT_AUDIT_EVIDENCE/g6-gap-closure-qualified-mathematical-review-set.json
```

It contains 84 deterministic retained samples: three samples for each of seven generators at each of four difficulty levels. The supplied answer and solution are present only to support later discrepancy tracing. Reviewers must solve the prompt independently first.

## Scope and Decisions

| Lesson number | Staged generator | Primary review question | Representation decision required? |
|---|---|---|---|
| `M6.EE.5.2` | `g6_ee_write_dependent_equation` | Does the displayed rate context determine exactly one correct equation and variable relationship? | No |
| `M6.GEO.1.4` | `g6_geo_area_composite_6` | Does the described decomposition provide all required dimensions and one unambiguous area? | Yes |
| `M6.GEO.2.2` | `g6_geo_surface_area_prism_6` | Are all prism faces accounted for, including triangular-prism lateral faces? | Yes |
| `M6.GEO.2.3` | `g6_geo_surface_area_pyramid_net_6` | Does the stated base-and-face structure adequately assess the intended net information? | Yes |
| `M6.GEO.4.1` | `g6_geo_area_real_world_6` | Are the real-world dimensions, units, and numerical expectations appropriate? | No |
| `M6.GEO.4.3` | `g6_geo_volume_word_6` | Are the real-world dimensions, units, and numerical expectations appropriate? | No |
| `M6.NS.4.6` | `g6_ns_identify_coordinate_plane_point_6` | Does the stated movement/pair/axis information adequately assess coordinate-plane understanding? | Yes |

> The four rows marked “Yes” deliberately use accessible structured text rather than an SVG diagram at this staging point. The reviewer must explicitly choose **Accept**, **Require a mapped diagram**, or **Reject/revise** for each such source. They are not approved merely because their arithmetic checks pass.

## Review Procedure

First, compare the named scope to the relevant Grade 6 expectations in the official North Carolina mathematics resources.[1][2] Next, independently solve each retained prompt without looking at its stored answer. Then compare your result to the stored answer and rationale. Mark **Reject** for an incorrect answer, inadequate information, multiple defensible answers, inappropriate complexity, unclear required format, unsuitable context/unit, or any representation concern.

| Review field in each sample | Required action |
|---|---|
| `reviewerCalculation` | Show the independent calculation or reasoning. |
| `reviewerRepresentationDecision` | For flagged items, use `accept`, `require mapped diagram`, or `reject/revise`. For other items, use `not applicable`. |
| `reviewerInitials` and `reviewerDate` | Record the reviewer identity marker and review date under the school’s evidence-handling policy. |
| `reviewerDecision` | Use `pass`, `reject`, or `needs discussion`. |

## Release Decision Rule

| Finding | Required response |
|---|---|
| Every retained sample passes and every structured representation is accepted | Request a separate guarded activation migration; then perform worksheet/PDF and class-bound Heat acceptance. |
| A representation needs a mapped diagram | Keep that generator inactive; build the diagram only with explicit concept mapping, render review, and a new review set. |
| Any mathematical, mapping, or answer-format defect | Keep the generator inactive; log the discrepancy, correct it deterministically, rerun the 1,000-per-difficulty invariant checks, and repeat qualified review. |
| Any uncertainty about grade level or standard interpretation | Keep the generator inactive pending curriculum clarification. |

No reviewer decision overrides the remaining production requirements: activation must be explicit, student worksheets must pass print/PDF checks, and a later class-bound Heat must prove exact scope, fresh question instances, and roster-only admission.

## References

[1] [North Carolina Department of Public Instruction — Mathematics Standard Course of Study supporting resources](https://www.dpi.nc.gov/districts-schools/classroom-resources/office-teaching-and-learning/standard-course-study/mathematics/standard-course-study-supporting-resources)

[2] [North Carolina Department of Public Instruction — Grade 6 Mathematics released form](https://www.dpi.nc.gov/documents/accountability/testing/eog/eog-mathematics-grade-6-released-form/open)
