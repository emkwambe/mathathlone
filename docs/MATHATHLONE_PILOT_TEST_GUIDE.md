# MathAthlone Controlled Rehearsal Guide

**Status:** Current through Sprint 16A

**Platform:** https://mathathlone.vercel.app

**Purpose:** Controlled pre-pilot verification only. This guide is not yet the operating procedure for the three-school classroom pilot.

> **Credential rule:** This document deliberately contains no passwords, PINs, API keys, or service-role values. The pilot administrator provisions and distributes test accounts through a private approved channel. Do not place usable credentials in Git, screenshots, issue tickets, or shared chat.

## Before the rehearsal

The administrator should provision one teacher account and at least five student accounts in the correct school/grade cohort. Confirm that every account can sign in individually before the session begins. The teacher should use a modern Chrome, Edge, or Safari browser, and students should use the same device types and network that will be used during the future pilot where possible.

The teacher should confirm that the live production application loads at `https://mathathlone.vercel.app`. If a page does not load, record the URL, approximate time, browser, device type, and a screenshot before retrying. Do not use an old development URL or a locally cached bookmark.

## Rehearsal A — Create and complete a Heat

The teacher signs in and opens the **Teacher Dashboard**, then selects **Create a Heat**. The current experience is a single-page **Heat Config Builder**, not the former sequential wizard. The teacher sets the audience/content, competition format, and integrity settings. The sticky summary must show a complete configuration before **Launch Heat** is enabled.

Use a short practice configuration for the first rehearsal. Select a grade-appropriate content division and course, a narrow topic or small mixed-topic set, a standard question profile, practice integrity, and a small question count/duration. The teacher should confirm that the summary makes clear which content is being used and which grade cohort receives the competitive result.

After launching the Heat, the teacher shares the generated Heat code only with the prepared student accounts. Every student joins the code in a separate browser/device, reaches the lobby, and appears in the expected participant count. The teacher should not start until all intended test accounts are visible.

During the lobby, ask one student to refresh and rejoin. Ask another student to background the browser briefly and return. Both should recover without losing the Heat. Start the Heat, allow each student to submit at least two answers, then let the timer complete or end the Heat deliberately. Confirm that every student receives a result and the teacher sees the expected overview.

| Observation | Expected result | If it fails |
|---|---|---|
| Newly launched Heat opens | The student join page resolves after a short retry, not an endless loader. | Capture the Heat code, time, user role, and error text. |
| Lobby membership | Each prepared student appears exactly once. | Record the affected account and whether it refreshed/rejoined. |
| Start/countdown | Participants transition from lobby to the same active Heat. | Record the countdown state and device/browser details. |
| Answer submission | Valid answers receive feedback and progress updates. | Capture the question display and entered answer without publishing student data. |
| Completion | Results calculate and remain visible after a refresh. | Record whether the Heat was timer-ended or teacher-ended. |

## Rehearsal B — Assessment generation and print check

A teacher or parent account opens **Generate Assessment** from the appropriate staff workflow. Confirm that the page shows the `Dashboard → Generate Assessment` context and that **Cancel** returns to the teacher dashboard rather than Heat creation. Generate one representative worksheet or quiz using the pilot grade/course.

Print or save the assessment using a representative school device. The teacher confirms that the worksheet does not exceed the required **four question pages and two answer-key pages**. The answer key must be distinct from question pages and browser-generated duplicate page numbers must not appear.

## Rehearsal C — League and visual bracket result

Use either a new test league or a legacy test league. A new league requires **Results rank toward** selection. That field identifies the peer cohort that receives standings and ELO; it is separate from the league content scope. For an older league that lacks the field, the league owner first uses the visible **Ranking Cohort** panel to select and save it.

After at least two eligible standings exist, generate a non-Swiss bracket. As the league creator, open the **Bracket** tab and select **Record Result** on a pending playable match. Choose one winner and enter both non-negative CTA scores. The result card should show the winner and scores, the next slot should populate, and the standings should refresh. A completed match must not show a second result action.

| Security check | Expected result |
|---|---|
| League cohort | The owner must select a cohort before the first elimination result if the league is legacy. |
| Result authority | Only the league creator or platform administrator can record the result. |
| Duplicate result | Reopening a completed match must not permit another submission. |
| Rating attribution | The result belongs to the defined league peer cohort, even when content is from a different division. |

## Information to record

For each rehearsal, note the session date/time, the production URL, Heat/league code or ID, role, browser/device, network, action attempted, result, and screenshot. Do not include student full names, dates of birth, passwords, PINs, or API credentials in the record.

## Pilot boundary

This guide verifies individual Heat, assessment, and league behavior in production. It does **not** authorize the three-school classroom pilot. That pilot begins only after the platform has teacher-managed class setup, roster-scoped Heat participation, school/district membership operations, multi-school authorization checks, and a successful three-school rehearsal.

## Escalation

For a blocking issue, preserve the page URL and timestamp, take a screenshot, and contact the pilot administrator through the privately agreed support channel. Do not share account credentials or service keys while reporting the issue.
