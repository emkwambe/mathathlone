# Grade Certification Charter

## 1. Objective

A grade may be closed only when every atomic concept has a safe, exact, approved delivery path and the grade has passed a controlled operational acceptance cycle.

## 2. Atomic-concept source requirement

Every atomic concept must have at least one of:

- an active deterministic/procedural generator whose mapping and output are approved; or
- an active static source with a current immutable review record, `is_verified=true`, and approved delivery metadata.

A concept with only an unverified static source, inactive staged mapping, missing source, ambiguous content, or unresolved readability issue is **not delivery-available**.

## 3. Required completion gates

### Gate A — Coverage

- All atomic concepts for the grade are inventoried.
- Each concept is classified as procedural, static, or another explicitly approved source type.
- No concept is silently omitted because it is difficult or not yet audited.
- Unavailable concepts remain visible and disabled in product selection.

### Gate B — Correctness and representation

- Answers are mathematically correct.
- Multiple-choice items have exactly one correct displayed option.
- Prompts align with the intended atomic concept.
- Fractions, equations, tables, diagrams, units, and wording are unambiguous and supported by the renderer.
- Mathematical errors, answer leakage, unsupported representation, and material ambiguity are release blockers.

### Gate C — Readability and presentation

- Browser and print/PDF renderings are inspected at usable scale.
- Text, symbols, options, tables, diagrams, answer spaces, and branding are legible.
- The worksheet/PDF print gate has no unresolved masking, low-ink, clipping, overflow, or pagination defect.

### Gate D — Delivery safety

- Worksheet generation respects selected concept scope and requested length.
- Student documents contain no answer key or hidden answers.
- Heat generation uses the exact selected concept scope and approved source plan.
- Fresh procedural instances are produced where required.
- Static-source repeats and linked worksheet-to-Heat exclusions are enforced where applicable.
- Teacher/Mathlete role routing and class-roster admission are server-authoritative.

### Gate E — Evidence and assurance

- Deterministic tools are used for formally testable claims where practical.
- AI-assisted evidence is permitted only with tool/method, input provenance, output reference, limitations, and owner decision recorded.
- Historical records retain their historical method; they are not retrospectively relabeled.
- Evidence identifies the exact code/data baseline and execution date.

### Gate F — Controlled acceptance

- One controlled worksheet-to-Heat cycle passes without release-blocking findings.
- Role routing, rostered admission, non-rostered denial, Heat state, source scope, and participant effects are checked.
- Print/PDF output is accepted by the owner.
- The owner explicitly closes the grade or records the remaining blockers.

## 4. Owner-only decisions

Only the project owner may:

- approve mathematical correctness, readability, representation, or classroom suitability;
- mark a static source verified;
- activate a staged generator mapping;
- approve curriculum/source substitutions;
- approve a grade as complete;
- deploy to production or release classroom content;
- start, cancel, reuse, or conduct participation in a controlled Heat.

Agents may prepare evidence and patches, but their recommendation is never an approval.

## 5. Stop conditions

Stop and report if:

- live evidence conflicts with the repository snapshot;
- source fingerprints or expected content drift;
- a concept has no approved delivery path;
- an answer, representation, or rendering is uncertain;
- credentials, protected workflows, or external permissions are required;
- a proposed change would alter source status, Heat state, production, or classroom release;
- a task exceeds the bounded work packet.

## 6. Grade-to-grade transition

Do not begin the next grade as the primary certification effort until the current grade has a signed readiness checkpoint covering Gates A–F. Work on another grade may be exploratory and clearly labeled, but it must not be represented as a completed-grade substitute.
