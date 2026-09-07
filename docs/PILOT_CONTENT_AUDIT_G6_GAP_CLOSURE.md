# Grade 6 Content-Gap Closure — Source-Level Audit Record

**Audit ID:** `PILOT-NC6M-GAP-001`
**Status:** Source remediation staged; **not classroom-ready**
**Course:** NC Grade 6 Math (`G6`)
**Ranking cohort:** Grade 6 / Intermediate
**Planned use:** Future low-stakes practice and intraclass class-bound Heat blueprints only after every remaining gate is met

## 1. Scope

This record covers the seven Grade 6 atomic concepts that the live coverage inventory identified as having **no active question source**. The work is intentionally bounded to those concepts; it does not make a Grade 6 whole-course readiness claim.

| Lesson number | Content focus | Staged source | Current state |
|---|---|---|---|
| `M6.EE.5.2` | Model a constant rate with an equation | `g6_ee_write_dependent_equation` | Staged inactive; source validation passed |
| `M6.GEO.1.4` | Decompose composite figures to find area | `g6_geo_area_composite_6` | Staged inactive; representation review required |
| `M6.GEO.2.2` | Find rectangular- or triangular-prism surface area | `g6_geo_surface_area_prism_6` | Staged inactive; representation review required |
| `M6.GEO.2.3` | Find pyramid surface area from net information | `g6_geo_surface_area_pyramid_net_6` | Staged inactive; representation review required |
| `M6.GEO.4.1` | Solve a real-world area application | `g6_geo_area_real_world_6` | Staged inactive; source validation passed |
| `M6.GEO.4.3` | Solve a real-world rectangular-prism volume application | `g6_geo_volume_word_6` | Staged inactive; source validation passed |
| `M6.NS.4.6` | Identify an ordered pair, quadrant, or axis | `g6_ns_identify_coordinate_plane_point_6` | Staged inactive; representation review required |

> **Staged inactive means unavailable for student worksheet or Heat selection.** Migration `054_stage_g6_gap_closure_sources.sql` records the exact mappings but deliberately sets `is_active = FALSE`. A separate post-review activation decision is required.

## 2. Deterministic Source Design

All seven sources are versioned, deterministic procedural generators. No AI creates, paraphrases, selects, labels, scores, or approves this content.

The four concepts whose versioned specification flags a diagram/visual representation use an accessible structured-text representation at this stage:

| Concept | Staged representation | Required qualified-review decision |
|---|---|---|
| `M6.GEO.1.4` | The visible prompt states a rectangle-plus-triangle or rectangle-minus-corner decomposition. | Accept as adequate decomposition information, require an explicitly mapped diagram, or reject/revise. |
| `M6.GEO.2.2` | The visible prompt states every rectangular-prism face relationship or every right-triangular-prism base/length measurement. | Accept as adequate net/surface information, require an explicitly mapped diagram, or reject/revise. |
| `M6.GEO.2.3` | The visible prompt specifies the base and every triangular face in the square- or rectangular-pyramid net; the solution decomposes base and lateral areas. | Accept as an adequate net-information representation, require an explicitly mapped diagram, or reject/revise. |
| `M6.NS.4.6` | The visible prompt states coordinate movement, an ordered pair, or an axis condition; the solution identifies the ordered pair, quadrant, or axis. | Accept as an adequate coordinate-plane representation, require an explicitly mapped graph, or reject/revise. |

None of these four sources is described as an SVG/diagram implementation. A source must not be activated merely because a calculation invariant passes.

## 3. Deterministic Mathematical Evidence

The permanent test file `src/lib/competition/g6-coverage-gap-closure.audit.test.ts` independently parses each **visible prompt** and recomputes its expected answer. It runs **1,000 deterministic samples at each of four difficulty levels for every generator**: 28,000 recomputed instances total.

| Generator family | Visible-prompt invariant | Samples | Result |
|---|---|---:|---|
| Rate equation | Constant rate in prompt matches expected dependent-variable equation | 4,000 | Pass |
| Composite area | Rectangle-minus-corner or rectangle-plus-triangle expression matches prompt dimensions | 4,000 | Pass |
| Prism surface area | `2(lw + lh + wh)` matches visible length, width, and height | 4,000 | Pass |
| Pyramid net | Base plus triangular-face areas matches the stated net structure | 4,000 | Pass |
| Real-world area | Rectangle, triangle, or parallelogram area matches stated dimensions | 4,000 | Pass |
| Real-world volume | `l × w × h` matches stated dimensions and units | 4,000 | Pass |
| Coordinate plane | Ordered pair, quadrant, or axis follows the stated coordinate signs/movement | 4,000 | Pass |

The deterministic qualified-review builder creates 84 retained items, three per generator at each difficulty. It is saved at `docs/PILOT_CONTENT_AUDIT_EVIDENCE/g6-gap-closure-qualified-mathematical-review-set.json` and includes prompt, supplied answer, solution steps, and blank reviewer fields. A reviewer must independently solve each item and must not treat the supplied answer as proof.

## 4. Source Reference and Alignment Boundary

The audit team must compare the bounded scope to the official North Carolina Department of Public Instruction mathematics standards resources and released Grade 6 mathematics materials.[^1][^2] This record makes no independent claim of official alignment or assessment prediction.

## 5. Release Gates Still Open

| Gate | Requirement | Status |
|---|---|---|
| Mapping review | Migration `054` applies exactly seven inactive source mappings to the named concepts. | Pending user-run migration and read-only verification |
| Qualified Grade 6 educator review | Independently solve retained samples; review wording, grade level, units, ambiguity, and the four structured representations. | Pending |
| Representation decision | Explicitly accept, revise to a mapped diagram, or reject each of the four staged structured representations. | Pending |
| Activation decision | Activate only reviewed mappings through a separate guarded migration. | Not authorized |
| Worksheet/PDF acceptance | Produce three representative student copies, including the special representations, and verify print/PDF. | Pending |
| Class-bound Heat acceptance | Verify exact blueprint, fresh generator instances, and roster-only admission after activation. | Pending |
| Defect review | Confirm no shared defect affects these generators, the renderer, or answer validation. | Pending |

**Release decision:** **Not ready.** The source gap is remediated in code and staged for audit, but all new mappings remain inactive and the scope is not approved for worksheet or Heat use.

## 6. Relationship to Existing Grade 6 Ratio Record

This gap-closure scope is separate from `PILOT_CONTENT_AUDIT_G6_RP_FIRST_SCOPE.md`. The prior ratios worksheet/PDF and return-flow evidence remains limited to its three approved ratios concepts. The cancelled `MA-QCBU`, `MA-KYXS`, and `MA-SRE7` records remain zero-participant audit evidence only; none establishes Heat acceptance for this new scope.

[^1]: North Carolina Department of Public Instruction, [Mathematics Standard Course of Study supporting resources](https://www.dpi.nc.gov/districts-schools/classroom-resources/office-teaching-and-learning/standard-course-study/mathematics/standard-course-study-supporting-resources).
[^2]: North Carolina Department of Public Instruction, [Grade 6 Mathematics released form](https://www.dpi.nc.gov/documents/accountability/testing/eog/eog-mathematics-grade-6-released-form/open).
