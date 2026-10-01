# Topic Work Packet — `<packet-id>`

## Assignment

- Grade: `<G6>`
- Topic: `<G6.RP>`
- Atomic scope: `<exact lesson numbers/concept IDs>`
- Work type: `read-only audit / deterministic audit / implementation proposal / integration review`
- Owner decision status: `not yet granted / granted for specified analysis only`

## Pinned inputs

- GitHub repository: `https://github.com/emkwambe/mathathlone.git`
- Commit: `<full commit SHA>`
- Control-pack version: `<version or commit>`
- Status snapshot: `<path and snapshot date>`
- Fresh SQL evidence: `<path/result reference or N/A>`
- Fixtures/assets: `<exact paths>`

## Objective

`<One sentence describing the bounded outcome.>`

## Required checks

Use the charter gates relevant to this packet. State each as `pass`, `hold`, `fail`, or `not tested`:

| Gate | Required check | Result |
|---|---|---|
| A | Concept coverage and source classification | `<status>` |
| B | Correctness and representation | `<status>` |
| C | Readability and print/PDF presentation | `<status>` |
| D | Delivery safety and scope enforcement | `<status>` |
| E | Evidence disclosure and provenance | `<status>` |
| F | Controlled acceptance | `<status or out of scope>` |

## Allowed actions

The agent may inspect the pinned inputs, run deterministic tests/tools, write a report to the assigned path, and prepare a non-deployed patch when explicitly requested.

## Prohibited actions

The agent must not run Supabase writes, verify static sources, activate generators, change source status, start/cancel/reuse/modify a Heat, publish classroom content, push to GitHub, deploy to Vercel, or request/share credentials.

## Stop conditions

Stop if the scope is ambiguous, evidence is stale or conflicting, a material mathematical/readability/security defect appears, or the work would require one of the prohibited actions.

## Deliverables

- Structured evidence record: `<exact path>`
- Optional review patch: `<exact path or N/A>`
- Test output: `<exact path or inline reference>`
- Owner decisions required: `<list>`
