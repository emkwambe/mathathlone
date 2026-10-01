# MathAthlone Grade Certification Control Pack

**Status:** Draft control reference for owner review
**Authoritative code baseline:** GitHub `main` at the commit supplied with each work packet
**Primary scope:** Grade-by-grade curriculum source certification and controlled pilot readiness

## Purpose

This pack is the common reference for all MathAthlone sub-agents. It defines what “grade complete” means, how evidence is recorded, what agents may do, and which decisions remain exclusively with the project owner.

## Files

- `GRADE_CERTIFICATION_CHARTER.md` — policy, gates, authority, and stop conditions.
- `CURRENT_STATUS_SNAPSHOT.json` — machine-readable baseline; refresh from live read-only evidence before relying on it.
- `EVIDENCE_RECORD_TEMPLATE.md` — required structure for every audit or implementation report.
- `TOPIC_WORK_PACKET_TEMPLATE.md` — bounded assignment template for one grade/topic.
- `SUBAGENT_OPERATING_RULES.md` — shared execution, workspace, and handoff rules.

## Precedence

1. Owner decisions and explicit approvals.
2. Fresh live database read-only evidence.
3. Current GitHub `main` commit named in the work packet.
4. This control pack and its committed templates.
5. Sub-agent findings and historical notes.

If two sources conflict, stop and report the conflict. Do not silently choose a value.

## Use protocol

1. The coordinator pins a Git commit and a snapshot version in the work packet.
2. Each agent receives one bounded topic or cross-cutting task.
3. Agents return a structured evidence record and identify owner decisions required.
4. The integration reviewer checks the reports, tests the combined change, and prepares one reviewable patch.
5. No verification, activation, deployment, Heat participation, or classroom release occurs without owner approval.

This pack is a coordination reference, not an authorization to change production or curriculum status.
