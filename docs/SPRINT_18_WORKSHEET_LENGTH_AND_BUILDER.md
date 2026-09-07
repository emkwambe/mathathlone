# Sprint 18 — Configurable Worksheet Length and Builder Clarity

**Status:** Worksheet-length and focused-practice work deployed through `fa5b0d3`; manual briefing and generator-preflight safeguards are tracked in subsequent releases.

## Purpose

Sprint 18 replaces the misleading fixed Practice Review description with a bounded teacher-selected worksheet length. It preserves the established competition-preparation rule: students receive a student-safe practice worksheet for announced skills, while a later Heat generates independent new instances of those skills.

The change is deliberately limited to worksheet configuration and assembly. It does not change mathematical generators, curriculum mappings, roster membership, Heat admission, classroom records, credentials, or audit status.

## Teacher interaction

The worksheet builder now presents a distinct **Worksheet Length** step after document type and before difficulty. Teachers can select a short, suggested, or extended preset, then fine-tune the count one question at a time with a range control. The same panel explains the generated mix of multiple-choice questions, free-response questions, and total points before the worksheet is generated.

| Document type | Allowed range | Suggested starting length | Intended use |
|---|---:|---:|---|
| Practice Review | 5–16 | 10 | Student-safe preparation; no answer key |
| Quiz | 6–16 | 12 | Short graded check |
| Homework | 5–14 | 8 | Take-home practice |
| Unit Test | 10–20 | 16 | Formal assessment |
| Makeup Test | 10–20 | 16 | Formal alternate assessment |

The page gives print guidance rather than guaranteeing a page count. Teachers must inspect browser print preview before distribution because unusually long generated prompts or workspace requirements can use more vertical space.

## Shared enforcement contract

The browser, secure worksheet API, and document assembler use the same `src/lib/assessment/config.ts` configuration. The API validates the selected integer count against the document type’s allowed range before generation. The assembler then creates exactly that number of questions and calculates the section mix and total points from the same contract.

A worksheet may select **one or more atomic concepts**. This supports focused mastery practice, such as working only on a missing-value ratio-table skill, as well as mixed-topic review. There is no artificial three-concept minimum for worksheets.

To preserve announced-skill coverage, the builder and API both reject a request where the number of selected concepts exceeds the requested question count. This ensures each selected concept can appear at least once. Heat Builder retains its independent competition configuration rules; this worksheet policy does not alter Heat selection requirements.

## Competition-preparation safeguards

Competition preparation continues to force the **Practice Review** type. The teacher may choose any allowed Practice Review length, but the document remains student-safe and no answer key is produced. The pre-existing topic/concept disclosure and independent-new-instance statement remain required.

## Manual briefing and generator-preflight safeguards

The competition-preparation briefing now uses only **manually authored, educator-approved** `atomic_concepts.announced_skill` records. It never substitutes the longer internal concept description and never invokes, paraphrases, or infers with AI. A competition-preparation worksheet is blocked when any selected concept lacks a manual label; standalone practice remains available, but it does not invent a student-facing skill label.

Both builders now also perform a read-only deterministic preflight against the active, implemented procedural-generator registry. An unavailable selected concept is visibly marked and blocks both worksheet handoff and Heat launch until the teacher revises the selection. A Heat-preparation blueprint is never silently changed; the teacher returns to Heat Builder to decide what to remove. The historical all-selected standalone default removes unavailable concepts only after the preflight completes and reports exactly how many were excluded.

Only the three approved Grade 6 ratios labels are seeded by this release: **Calculate a unit rate**, **Solve a missing value in a ratio table**, and **Solve a ratio word problem**. Broader course-content audit completion remains a documented pilot release gate, not an in-product status feature. The complete policy boundary is recorded in [`DETERMINISTIC_FIRST_CONTENT_AND_ANALYTICS_POLICY.md`](./DETERMINISTIC_FIRST_CONTENT_AND_ANALYTICS_POLICY.md).

## Acceptance criteria

1. A 10-question Grade 6 ratios Practice Review declares and renders exactly 10 questions, including 6 multiple-choice and 4 free-response questions under the configured 40% ratio.
2. The builder summary, API validation, and printable document agree on question count, section mix, and total points.
3. One selected atomic concept is accepted for focused practice; a selected question count below the number of selected concepts is blocked before generation and by the API.
4. A competition-preparation student copy displays only manual, approved announced skills as a readable list, includes the independent-new-instance statement, and contains no answer key.
5. A competition-preparation request with an unlabeled concept is visibly paused in the builder and rejected by the secure API without falling back to an internal label.
6. Both builders identify every selected concept without an active implemented practice generator before a worksheet handoff or Heat launch. A preparation blueprint is not silently altered.
7. PDF print preview has no spurious trailing answer-key page; the teacher reviews actual pagination before distribution.
8. Returning to Heat Builder preserves the original class, skill blueprint, practice mode, and Heat configuration.

## Remaining pilot-safety work

Grade 6 ratios still requires qualified Grade 6 educator sign-off and the controlled production worksheet/PDF/Heat evidence. NC Math 1 linear still requires qualified NC Math 1 educator review and its own controlled production acceptance. All other course scopes require a recorded audit that closes presentability, mathematical-accuracy, qualified-review, and operational gates before any classroom-ready claim.
