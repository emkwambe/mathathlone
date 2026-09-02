# Pilot Content Audit — Grade 6 Ratios and Proportional Relationships

**Audit ID:** `PILOT-NC6M-RP-001`
**Status:** **Pending final production worksheet-to-Heat acceptance**
**Scope:** NC Grade 6 Math → Ratios and Proportional Relationships
**Ranking cohort:** Grade 6
**Content level:** Grade 6
**Planned sequence:** Competition-preparation worksheet, followed by a short intraclass practice Heat
**Audit date:** 2026-09-02
**Author:** Manus AI

## 1. Release decision

The selected three-concept scope has a sound technical foundation. The live database maps every approved skill to an active generator, all fifteen regenerated difficulty-2 items were mathematically correct, and each generator produced five distinct item instances. The printable ratio-table representation is structurally encoded as a KaTeX array and passed a local rendering check.

The source-level findings have been remediated. The unit-rate generator now constrains familiar retail prices to realistic whole-dollar values, and the 1:1 ratio explanation now uses singular grammar. The scope remains **pending final production acceptance**: the worksheet-to-Heat flow and corrected ratio table must be verified in the deployed application and a saved PDF before student use.

| Gate | Finding | Status |
|---|---|---|
| Canonical live mapping | All three announced skills map to active production generators in the expected course/topic. | Pass |
| Generator variation | Each generator produced five distinct medium-difficulty prompt instances. | Pass |
| Mathematical correctness | Independent arithmetic/proportion review of all fifteen samples passed. | Pass |
| Ratio-table structure | Worksheet variant emits a structured KaTeX table; accessible live text remains separate. | Pass locally; production print evidence pending |
| Student wording and realism | Apple contexts now produce whole-dollar prices of **$1–$4 per apple** when selected. | Pass after remediation |
| Worksheet/Heat independence | Source implementation generates independent instances from the same canonical concepts. | Pass in implementation review; production flow test pending |
| Classroom release | Conditions above unresolved. | **Not ready** |

## 2. Approved audit scope

Students in the first Grade 6 classroom rehearsal would be told that they will practice and later compete on the following three skills. The practice worksheet may disclose these skills. It must not disclose the future Heat items, values, answer ordering, or answer set.

| Announced skill | Generator type | Live concept ID | Canonical concept name in live data |
|---|---|---|---|
| Calculate a unit rate | `g6_rp_calculate_unit_rate` | `22bb9092-6fd5-4baf-9009-44206aeda215` | Given a rate, compute the unit rate. |
| Solve a missing value in a ratio table | `g6_rp_ratio_table_solve` | `8efaed43-adee-449d-b703-bcf60bdb3726` | Given a ratio table with one missing entry, compute the missing equivalent ratio. |
| Solve a ratio word problem | `g6_rp_ratio_word_problem` | `774c8ce5-3546-4ce3-b25a-21a720d5b705` | Real-world ratio problem using a part-to-part or part-to-whole ratio and a given quantity. |

The live inventory confirmed that every row maps to **NC Grade 6 Math** (`G6`) and **Ratios and Proportional Relationships**, with `is_active = true` for its generator.

## 3. Sampling method and evidence

Five deterministic difficulty-2 instances were regenerated for each approved generator from the checked-in generator source after remediation. This produced fifteen reviewable items. The evidence file is [`PILOT_CONTENT_AUDIT_EVIDENCE/g6-ratio-first-scope-samples.json`](./PILOT_CONTENT_AUDIT_EVIDENCE/g6-ratio-first-scope-samples.json).

This sampling checks source behavior and generator variation. It does not replace the required production worksheet/PDF and class-bound Heat rehearsal after deployment.

| Generator | Samples reviewed | Unique prompt texts | Answer format | Structured worksheet math |
|---|---:|---:|---|---|
| `g6_rp_calculate_unit_rate` | 5 | 5 | Numeric rate | Not required |
| `g6_rp_ratio_table_solve` | 5 | 5 | Numeric missing value | Yes — KaTeX two-column table |
| `g6_rp_ratio_word_problem` | 5 | 5 | Numeric part value | Not required |

## 4. Mathematical validity review

Every sampled result was independently recomputed from the prompt. No sample produced a contradiction, missing information, a non-integer part in the part-to-part word problems, or a duplicate correct response.

| Generator | Representative calculation checks | Result |
|---|---|---|
| Unit rate | `28 ÷ 7 = 4`; `36 ÷ 9 = 4`; `536 ÷ 8 = 67` | Correct |
| Ratio table | `12 × 5 = 60`; `7 × 10 = 70`; `14 × 11 = 154`; `6 × 2 = 12` | Correct |
| Ratio word problem | `50 × 3/(2+3) = 30`; `63 × 2/(2+5) = 18`; `72 × 5/(3+5) = 45`; `45 × 2/(2+1) = 30` | Correct |

The sampled question forms are free response. Multiple-choice distractor quality is therefore not applicable to this specific first scope.

## 5. Rendering and practice-versus-Heat review

The original ratio-table defect was a presentation defect: the values were flattened into a pipe-separated line in a worksheet. The worksheet generator now provides a distinct formatted version using a two-column KaTeX array, while preserving newline-separated plain text for the live Heat’s accessible prompt path. A local KaTeX rendering check confirmed the structured table is recognized as a mathematical table.

| Requirement | Current evidence | Remaining action |
|---|---|---|
| Table looks like a table in practice worksheet | Structured `array` markup is emitted by every sampled ratio-table item. | Verify on deployed worksheet screen and Chrome saved PDF. |
| Live Heat stays readable | Plain text keeps rows on separate lines, rather than injecting worksheet-only KaTeX. | Verify during the class-bound practice Heat. |
| Same skills, fresh questions | Practice and Heat draw separately from the canonical generator set; the preparation worksheet carries concepts, not generated questions. | Generate worksheet, return to Builder, launch Heat, and compare instances. |
| Student answer protection | Competition-preparation worksheet uses Practice Review and contains no answer key. | Verify the deployed document shows no answer-key pages. |

## 6. Findings and remediation backlog

| ID | Severity | Finding | Why it matters | Required remediation | Re-test evidence |
|---|---|---|---|---|---|
| `RP-001` | **Closed** | The unit-rate generator previously produced implausibly expensive apple contexts. | The arithmetic was correct but the ordinary-shopping context could distract Grade 6 students. | Apple unit rates are now constrained to $1–$4, with new samples captured. | Five revised samples pass. |
| `RP-002` | **Closed** | A 1:1 solution could say “Red = 1 parts.” | The answer was correct but grammatically imprecise. | Singular `part` is now used when the factor equals 1. | Revised 1:1 sample passes. |
| `RP-003` | Major until completed | New ratio-table worksheet rendering has not been inspected in production print/PDF output. | Local structured markup does not prove final browser printing on school devices. | Deploy worksheet improvement; generate one competition-preparation worksheet containing ratio tables; inspect browser preview and saved PDF. | Screenshot and saved PDF meeting the page/layout checklist. |
| `RP-004` | Major until completed | The Heat-to-worksheet return and independent-instance behavior has not been exercised using a rostered teacher class in production. | Fair preparation requires preserving the blueprint without revealing or reusing Heat items. | Run the designated teacher acceptance flow and compare practice versus Heat questions. | Builder, worksheet, and Heat captures; completed linkage checklist. |

## 7. Required release evidence after remediation

The course may be marked **Ready** only when the following package is complete.

1. A deployed teacher generates a competition-preparation worksheet with all three concepts. The document shows the course, topic, concepts, fresh-instance statement, and no teacher answer key.
2. The ratio-table item is readable as a two-column table in the page view and in a saved Chrome PDF.
3. The worksheet stays within the pilot page target: normally at most four student-question pages; no spurious blank answer-key page for a Practice Review.
4. Returning from the worksheet restores the selected class, course, concepts, mode, profile, timing, and content division in the Heat Builder.
5. A teacher launches a short class-bound practice Heat and confirms it generates new ratio/unit-rate/word-problem instances rather than retrieving the worksheet items.
6. A Mathlete outside the rostered class is denied entry to that class-bound Heat.

## 8. Conditional configuration recommendation

Do **not** announce this scope to real classrooms until the remaining production evidence items `RP-003` and `RP-004` are closed. After closure, use this conservative first configuration.

| Setting | Recommended value |
|---|---|
| Ranking cohort | Grade 6 |
| Content level | NC Grade 6 Math |
| Course/topic | Ratios and Proportional Relationships |
| Concepts | Unit rate, missing ratio-table value, ratio word problem only |
| Preparation | Competition-preparation Practice Review; no answer key distributed to students |
| First Heat | Intraclass practice Heat, 8 questions, approximately 12 minutes, standard profile, practice integrity |
| Result interpretation | Informal classroom feedback only; no ELO, bracket, interclass, or interschool claim |

## 9. Audit conclusion

The selected scope is an appropriate **first audit unit** because it is narrow, has active coverage for all announced skills, and deliberately includes the visual ratio-table format that was recently corrected. The fifteen regenerated medium-difficulty samples contain no mathematical-answer defect; the unit-rate realism and singular-grammar findings are closed.

The remaining next move is one production worksheet-to-Heat rehearsal. After its print/PDF and class-bound Heat evidence is complete, the platform owner can make a defensible Grade 6 intraclass pilot release decision for this three-concept scope.
