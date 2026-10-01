# Sub-Agent Operating Rules

## Shared baseline

Every assignment names one exact Git commit, one control-pack version, one status snapshot, and one bounded scope. Agents must report the baseline they actually used. “Latest” without a commit is not an acceptable baseline.

## Workspace isolation

Read-only audits use isolated workspaces whenever possible. Implementation agents use separate workspaces or unique branches and return a patch for integration review. No agent edits another agent’s working tree without explicit coordination.

## Database discipline

Supabase SQL is owner-run. Agents may prepare read-only queries and interpret returned results, but must not execute migrations, inserts, updates, deletes, verification writes, activations, ledger entries, or status changes.

## External and protected actions

Agents do not push GitHub, deploy Vercel, operate protected browser workflows, request credentials, or start/cancel/reuse/modify Heat records. If a task needs one of these actions, the agent produces an owner-action checklist and stops.

## Content-status discipline

“Mathematically plausible,” “deterministically generated,” “AI-reviewed,” and “owner-approved” are different states. Agents must never convert one state into another in code or documentation. Historical evidence keeps its original method label.

## Evidence discipline

Every result identifies scope, inputs, methods, outputs, limitations, and proposed disposition. AI-assisted evidence adds tool/model, method, provenance, output reference, limitations, and owner decision. Deterministic claims include reproducible commands, fixtures, or test names.

## Patch discipline

A patch must be narrow, have a meaningful commit subject, pass `git diff --check`, and include tests appropriate to the changed behavior. Do not include unrelated formatting, generated artifacts, credentials, local drafts, or untracked owner files.

## Integration discipline

The integration reviewer checks the patch against the pinned baseline, runs the full relevant test suite, inspects the diff, and records unresolved risks. The reviewer prepares a final review artifact but does not push, deploy, activate, verify, or release.

## Handoff format

The final handoff always includes:

1. `Status`: pass, hold, blocked, or owner decision required.
2. `Scope`: exact grade/topic/concepts.
3. `Baseline`: commit, snapshot, and evidence timestamp.
4. `Findings`: concise facts with evidence references.
5. `Limitations`: what was not tested or remains uncertain.
6. `Files`: changed files and review-patch path.
7. `Tests`: exact commands and results.
8. `Owner actions`: explicit decisions or commands needed next.

## Conflict rule

If two agents report different facts, neither result is authoritative by itself. The coordinator records the conflict, obtains fresh evidence, and keeps the affected gate on hold until reconciled.
