# Deterministic-First Content and Analytics Policy

**Status:** Approved product policy for the controlled pilot  
**Scope:** Curriculum metadata, worksheets, Heat generation and delivery, scoring, eligibility, roster operations, and any future analytical insight features.

## Policy statement

Mathathlone treats instructional content and operational outcomes as **deterministic, traceable system records**. The platform must use approved curriculum data, explicit generator rules, validated arithmetic, and reproducible policy logic wherever an output affects what a student practices, what they are assessed on, who may enter a Heat, or how a result is calculated.

Artificial intelligence is not used to create, paraphrase, infer, or alter such records. AI may be considered only for clearly labeled, non-authoritative **derived analytical insights** based on already validated aggregate data. An insight may help an educator identify a pattern to investigate; it may not replace source records, mathematical validation, educator review, score calculations, eligibility checks, or content-approval decisions.

## Deterministic domains

| Domain | Required implementation approach | AI use |
|---|---|---|
| Atomic-concept titles and student-facing announced skills | Manually authored, educator-approved, version-controlled curriculum metadata | Prohibited |
| Worksheet content selection and coverage | Explicit selected concept IDs, validated generators, bounded configuration rules | Prohibited |
| Question generation and answer calculation | Tested procedural generators and independent mathematical checks | Prohibited |
| Worksheet structure, point totals, answer keys, and print rules | Shared deterministic configuration and template logic | Prohibited |
| Heat selection, roster admission, timing, and eligibility | Authorization and class-enrollment rules enforced by the application and database | Prohibited |
| Scoring, rankings, and reports | Deterministic calculations from stored competition events | Prohibited |
| Audit status and release gates | Recorded reviewer decisions and operational acceptance evidence | Prohibited |

## Controlled use of derived analytical insights

A future analytical feature may summarize validated aggregate records, for example by noting a class-level pattern in a previously completed, non-high-stakes practice activity. It must label the insight as advisory, show its underlying deterministic measures, avoid generating individual high-stakes decisions, and allow the educator to disregard it.

The feature must not describe an insight as an assessment result, diagnosis, prediction of state-exam performance, or automatic recommendation to advance, retain, rank, discipline, or restrict a student. It must also preserve the platform's privacy and data-minimization rules.

## Student briefing requirement

A competition-preparation worksheet must display a concise briefing derived only from approved curriculum data. Its student-facing announced skills must be stored or seeded as reviewed text, separate from the longer internal concept descriptions used for generator and audit work. If an approved announced skill is unavailable, the worksheet must not invent or paraphrase one. The teacher should instead receive a clear content-review status indication before distribution.

For the first audited Grade 6 ratios scope, the approved announced skills are: **Calculate a unit rate**, **Solve a missing value in a ratio table**, and **Solve a ratio word problem**.

## Change-control requirement

Any change to deterministic content, scoring, eligibility, roster, or audit behavior requires source review, appropriate tests, and the relevant educator or operational acceptance gate. Any future AI integration must be separately planned, disclose its advisory limits in the interface, and receive explicit authorization before implementation.
