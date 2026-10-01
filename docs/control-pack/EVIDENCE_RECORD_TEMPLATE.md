# Evidence Record — `<grade> / <topic> / <work item>`

## Record metadata

| Field | Value |
|---|---|
| Record ID | `<stable-id>` |
| Agent or role | `<agent-name-or-role>` |
| Work packet | `<packet-id>` |
| Repository commit | `<full-commit>` |
| Database evidence timestamp | `<UTC timestamp or N/A>` |
| Status | `draft / reviewed / owner-decision-required / accepted / blocked` |

## Scope

State the exact grade, topic, atomic concept IDs or lesson numbers, source types, files, and database rows examined. State what was explicitly out of scope.

## Methods and provenance

For each method, record:

| Method/tool | Input provenance | Output reference | Limitations |
|---|---|---|---|
| `<Python / Wolfram / AI tool / SQL / test>` | `<exact fixture, query, file, commit>` | `<path, result, log, or URL>` | `<known limits>` |

AI-assisted work must name the model/tool and method, identify the input source, link or name the output, and state limitations. Deterministic checks should include the command or test name.

## Findings

### Coverage

`<Every scoped concept has / does not have an approved delivery path. List exceptions.>`

### Correctness

`<Mathematical and answer-key findings. State exact item IDs and whether exactly one displayed option is correct.>`

### Representation and readability

`<Rendering, wording, fractions, equations, tables, diagrams, print/PDF findings.>`

### Delivery and security

`<Scope enforcement, redaction, source-plan, repeat/exclusion, role, roster, and Heat findings.>`

## Evidence summary

| Claim | Evidence | Result | Confidence/limitation |
|---|---|---|---|
| `<claim>` | `<test/query/output>` | `pass / hold / fail / not tested` | `<limitation>` |

## Proposed disposition

Choose one: `PASS`, `HOLD`, `BLOCKED`, or `OWNER DECISION REQUIRED`.

This disposition is a recommendation only. It does not verify, activate, deploy, or release content.

## Owner decision required

List each decision in an explicit form, for example:

- Approve or reject source `<id>` for concept `<lesson-number>`.
- Approve or reject activation of mapping `<generator-type>`.
- Accept or defer worksheet print finding `<finding-id>`.
- Close or keep open grade/topic gate `<gate>`.

## Files and tests

- Files changed: `<none or exact paths>`
- Patch/commit: `<none or full commit>`
- Tests/commands: `<exact commands and results>`
- Untracked files preserved: `<yes/no and paths>`
