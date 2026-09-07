# Pilot Content Audit — Grade 6 Ratios and Proportional Relationships

**Audit ID:** `PILOT-NC6M-RP-001`
**Status:** **Pending qualified reviewer sign-off and final production worksheet-to-Heat acceptance**
**Scope:** NC Grade 6 Math → Ratios and Proportional Relationships
**Ranking cohort:** Grade 6
**Content level:** Grade 6
**Planned sequence:** Competition-preparation worksheet, followed by a short intraclass practice Heat
**Audit date:** 2026-09-02
**Author:** Manus AI

## 1. Release decision

The three-concept scope has passed its current **source-level mathematical and generator-quality gates**. The live database maps every approved skill to an active generator. The calibrated source has passed 12,000 independently seeded invariant checks: 1,000 items for each of the three generators at every supported difficulty level. The automated review recomputed every answer from the visible prompts rather than trusting the answer field, and found no wrong answer, contradiction, invalid ratio, malformed table value, or ambiguity in the retained samples.

This is **not yet a classroom-release decision**. The mathematical-correctness veto is clear only provisionally until a qualified teacher or curriculum reviewer signs the retained 60-item review set. The production worksheet/PDF and class-bound Heat evidence also remain required. A technically successful deployment cannot waive either requirement.

> **Mathematical-correctness veto:** One incorrect answer, contradictory prompt, invalid diagram or table, ambiguous required response, or unintended second correct option would immediately halt this concept scope. A defect in shared rendering, answer validation, or a shared generator utility would require impact review of every dependent scope before release work continued.

| Gate | Finding | Status |
|---|---|---|
| Canonical live mapping | All three announced skills map to active production generators in the expected course/topic. | Pass |
| Mathematical invariant checks | 12,000 seeded items passed: 1,000 for each generator at each of difficulties 1–4. | Pass |
| Retained independent review | All 60 non-repeating retained samples passed independent recomputation and calibration review. | Pass; qualified reviewer sign-off pending |
| Difficulty progression | All three generators now use explicit level-1 through level-4 progressions. | Pass locally |
| Same-session uniqueness | Printable worksheets and procedural Heat items retry boundedly to avoid exact duplicate visible prompts. | Pass in source test; production flow test pending |
| Ratio-table structure | Worksheet output emits a structured KaTeX table; accessible live text remains separate. | Pass locally; production PDF evidence pending |
| Student wording and realism | Unit-rate contexts are realistic, and singular ratio grammar is correct. | Pass locally |
| Worksheet/Heat independence | Source implementation generates fresh instances from the same canonical concepts. | Pass in implementation review; production flow test pending |
| Classroom release | Qualified reviewer and production evidence are incomplete. | **Not ready** |

## 2. Approved audit scope

Students in the first Grade 6 classroom rehearsal would be told that they will practice and later compete on the following three skills. The preparation worksheet may disclose these skills. It must not disclose future Heat values, answer ordering, or answer sets.

| Announced skill | Generator type | Live concept ID | Canonical concept name in live data |
|---|---|---|---|
| Calculate a unit rate | `g6_rp_calculate_unit_rate` | `22bb9092-6fd5-4baf-9009-44206aeda215` | Given a rate, compute the unit rate. |
| Solve a missing value in a ratio table | `g6_rp_ratio_table_solve` | `8efaed43-adee-449d-b703-bcf60bdb3726` | Given a ratio table with one missing entry, compute the missing equivalent ratio. |
| Solve a ratio word problem | `g6_rp_ratio_word_problem` | `774c8ce5-3546-4ce3-b25a-21a720d5b705` | Real-world ratio problem using a part-to-part or part-to-whole ratio and a given quantity. |

The live inventory confirmed that every row maps to **NC Grade 6 Math** (`G6`) and **Ratios and Proportional Relationships**, with `is_active = true` for its generator.

## 3. Mathematical evidence and review protocol

The following evidence must travel with this course record. The automated invariant test is a recurrence and arithmetic check; it does not replace the qualified reviewer’s responsibility to evaluate wording, age appropriateness, ambiguity, and visual fidelity.

| Evidence artifact | What it proves | Current result |
|---|---|---|
| [`g6-ratio-mathematical-invariants.json`](./PILOT_CONTENT_AUDIT_EVIDENCE/g6-ratio-mathematical-invariants.json) | Prompt values were parsed and independently recomputed across all three generator families and all four difficulties. It also tests bounded duplicate retry and exhaustion behavior. | 12,000 / 12,000 pass |
| [`g6-ratio-qualified-mathematical-review-set.json`](./PILOT_CONTENT_AUDIT_EVIDENCE/g6-ratio-qualified-mathematical-review-set.json) | Sixty non-repeating retained prompts: five per generator at each difficulty, with fields for reviewer calculations, initials, date, and decision. | Pending qualified reviewer sign-off |
| [`g6-ratio-independent-review-summary.json`](./PILOT_CONTENT_AUDIT_EVIDENCE/g6-ratio-independent-review-summary.json) | Independent prompt-by-prompt mathematical and calibration review of the retained set. | All 12 groups pass |
| [`g6-ratio-first-scope-samples.json`](./PILOT_CONTENT_AUDIT_EVIDENCE/g6-ratio-first-scope-samples.json) | Historical first medium-difficulty sampling evidence retained for traceability. | Superseded by the retained 60-item set |

### 3.1 Difficulty progression

Each difficulty remains within the same Grade 6 standard. It changes the amount of numerical reasoning or representation needed, not the announced concept.

| Generator | Difficulty 1 | Difficulty 2 | Difficulty 3 | Difficulty 4 |
|---|---|---|---|---|
| Unit rate | Small whole-number divisors and introductory contexts. | Divisors 5–7 and larger non-overlapping rates. | Divisors 8, 9, or 11 with larger rates. | Divisors 12–15 with the largest rates. |
| Ratio table | Unit row is visible; small multiplier and target. | Unit row remains visible; multiplier and target increase. | Unit row is removed; students derive the unit rate from an equivalent pair. | No unit row; larger multiplier and target values. |
| Ratio word problem | Simple coprime ratios and small whole-number groups. | Larger ratio structures and a greater value per part. | Larger ratios and groups. | Largest approved ratios and groups, still yielding whole-number answers. |

## 4. Mathematical validity review

The automated invariant test verified every generated answer from visible prompt values. The retained independent review then recomputed all 60 saved items. No wrong answer, contradictory relation, non-integer intended count, duplicate retained prompt, invalid ratio-table relation, or malformed singular explanation remains in the final evidence set.

| Generator | Independent computation method | Source-level result |
|---|---|---|
| Unit rate | Divide the stated total by the stated count/time/servings. Confirm the whole-number divisor and rate fall within the declared difficulty band. | Pass across difficulties 1–4 |
| Ratio table | Derive the constant of proportionality from a known row and calculate the missing `y` value. Confirm table rows maintain one proportional relationship. | Pass across difficulties 1–4 |
| Ratio word problem | Divide the total by the sum of ratio parts, then multiply by the asked-for part count. Confirm the ratio pair and total multiplier match the difficulty band. | Pass across difficulties 1–4 |

The first-scope questions are free response. Multiple-choice distractor quality therefore does not apply to this release record.

## 5. Rendering, uniqueness, and practice-versus-Heat review

The original ratio-table defect was a presentation defect: values were flattened into a pipe-separated line in a worksheet. The worksheet path now uses a structured two-column KaTeX array, while the live Heat retains newline-separated plain text for accessibility. Exact duplicate visible procedural prompts are no longer accepted in one assembled worksheet or Heat; the system retries up to 12 times and fails clearly rather than silently presenting a duplicate or shortening the set.

| Requirement | Current evidence | Remaining action |
|---|---|---|
| Ratio table looks like a table in practice worksheet | Structured `array` markup is emitted and verified in the invariant suite. | Verify the deployed worksheet screen and Chrome saved PDF. |
| Live Heat stays readable | Plain-text rows remain separate from worksheet-only KaTeX. | Verify during the class-bound practice Heat. |
| No exact duplicate procedural prompt in one session | Shared bounded-retry helper is applied to worksheet assembly and procedural Heat insertion. | Verify one 8-question production Heat and one worksheet. |
| Same skills, fresh questions | Practice and Heat call separate generator runs from one canonical concept blueprint. | Generate worksheet, return to Builder, launch Heat, and compare instances. |
| Student answer protection | Competition-preparation worksheet uses Practice Review and contains no answer key. | Verify the deployed document shows no answer-key pages. |

## 6. Findings and remediation status

| ID | Severity | Finding | Resolution or required action | Status |
|---|---|---|---|---|
| `RP-001` | Major | Unit-rate apple contexts could be implausible. | Whole-dollar apple pricing is constrained to the introductory level; higher levels use contexts with meaningful computational demand. | Closed in source; production evidence pending |
| `RP-002` | Minor | A 1:1 solution could say “1 parts.” | Singular `part` is used when the factor equals 1. | Closed |
| `RP-003` | Major | Ratio-table worksheet rendering was flattened. | Structured KaTeX table is emitted; live Heat preserves accessible plain text. | Source closed; production PDF evidence pending |
| `RP-004` | Major | Worksheet-to-Heat preparation flow has not been rehearsed in production with a rostered class. | Complete the designated teacher workflow and compare independently generated practice and Heat items. | Open release gate |
| `RP-005` | Major | Difficulty levels were not reliably differentiated across the three generator families. | All three generators now use explicit non-overlapping numerical or representation progressions. | Closed in source; qualified sign-off pending |
| `RP-006` | Major | Repeated procedural prompts could appear in one assembled session. | Shared bounded retry prevents exact duplicate student-visible prompts in worksheets and procedural Heat items. | Closed in source; production session evidence pending |
| `RP-007` | Major | The student briefing exposed raw internal concept labels rather than concise approved skill labels. | Store only the three reviewed Grade 6 labels as manual `announced_skill` metadata; reject competition preparation when a selected label is missing. | Deployed; production worksheet and PDF evidence passed |
| `RP-008` | Critical | A short Heat created with three explicit Grade 6 ratio concept IDs admitted unmapped visual questions outside that scope. The Heat was detected before start, with zero participants. | Treat an explicit atomic-concept selection as a strict content boundary: disable unmapped visual fallback and backfill only from selected procedural generators or static questions whose concept mapping matches the selected IDs. Preserve the invalid unstarted Heat as an audit record; validate and deploy the correction before any replacement Heat. | Open release gate |

## 7. Remaining release evidence

The course may be marked **Ready** only when all items below are complete.

1. A qualified Grade 6 teacher or curriculum reviewer independently completes and signs the 60-item retained review set. Any rejected item reopens the mathematical veto for the affected generator and difficulty.
2. A deployed teacher generates a competition-preparation worksheet with all three concepts. The document shows the course, topic, the three manually approved student-facing skills as a readable list, the fresh-instance statement, and no teacher answer key. It must not show raw internal concept names in the student briefing.
3. A ratio-table item is readable as a two-column table in the page view and in a saved Chrome PDF.
4. The Practice Review stays within the pilot page target: normally at most four student-question pages and no spurious blank answer-key page.
5. Returning from the worksheet restores the selected class, course, concepts, mode, profile, timing, and content division in the Heat Builder.
6. A teacher launches a short class-bound practice Heat and confirms that **every** generated question is mapped to the selected three concepts, then confirms fresh unit-rate, ratio-table, and ratio-word-problem instances against the worksheet.
7. The worksheet and Heat evidence each show no duplicate student-visible procedural prompt.
8. A Mathlete outside the rostered class is denied entry to that class-bound Heat.
9. `RP-008` is closed only after the explicit-concept scope correction is deployed and a replacement Heat contains no unmapped visual or other out-of-scope content.

## 8. Conditional configuration recommendation

Do **not** announce this scope to real classrooms until the remaining sign-off and production evidence are complete. After closure, use this conservative first configuration.

| Setting | Recommended value |
|---|---|
| Ranking cohort | Grade 6 |
| Content level | NC Grade 6 Math |
| Course/topic | Ratios and Proportional Relationships |
| Concepts | Unit rate, missing ratio-table value, and ratio word problem only |
| Preparation | Competition-preparation Practice Review; no answer key distributed to students |
| First Heat | Intraclass practice Heat, 8 questions, approximately 12 minutes, standard profile, practice integrity |
| Result interpretation | Informal classroom feedback only; no ELO, bracket, interclass, or interschool claim |

## 9. Audit conclusion

The selected Grade 6 scope now has stronger mathematical controls than a technical smoke test: an explicit no-waiver correctness veto, machine-verified arithmetic invariants, retained non-repeating review samples, independent recomputation evidence, calibrated difficulty bands, and a shared duplicate-resistance mechanism.

The current mathematical evidence is favorable, but the release remains intentionally conservative. The rejected unstarted Heat confirms that a technically successful worksheet does not waive Heat-content verification. A qualified educator’s review of the retained set, deployment of the strict explicit-concept scope correction, and a new clean production worksheet-to-Heat rehearsal are the remaining gates before the platform owner can issue a defensible Grade 6 intraclass pilot release decision.
