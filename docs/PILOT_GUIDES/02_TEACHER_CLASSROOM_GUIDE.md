# Guide 2 — Teacher Classroom Guide

**Use this guide for:** preparing one of your assigned classes, creating privacy-minimizing managed Mathlete accounts, sharing the right Heat, and supervising a classroom competition from lobby to results.

> **Prepare before the lesson.** Create the class, load the roster, and print new credentials before students arrive. A class-bound Heat admits only active members of the selected class.[1]

## 1. Before you begin

You must be an active **Teacher** assigned to the school where you teach. If your role was assigned today, sign out of Mathathlone, close the tab, and sign in again before opening the teacher dashboard. Teachers create only their own classes; coordinators may review school-level activity but should not create a teacher’s class for them.[1] [2]

| Bring to setup | Why it is needed | Do not use |
|---|---|---|
| A school-approved class name | Identifies the class in your dashboard | A full list of student legal names if privacy-safe display names will do |
| The class grade level | Determines the classroom’s grade context | The content level alone; grade cohort is a separate recognition/ranking principle |
| Privacy-safe student display names | Creates a managed classroom roster | Student personal emails, public usernames, or shared passwords |
| A secure way to hand each student a card | Delivers the username/PIN privately | A projected screen, public chat, or whole-class spreadsheet |

## 2. Create your class

### Action

From **Teacher Dashboard**, open **Classes & Roster**. In **Create a class and prepare Mathlete access**, enter a class name and choose its grade level, then select **Create class**.

| Field | Example | Expected result |
|---|---|---|
| Class name | `Grade 7 Math — Period 2` | The class appears under **My classes**. |
| Grade level | `Grade 7` | The class card displays the grade and an automatically generated class code. |

The class code identifies the class but does not replace the managed login card. Do not post student temporary PINs with the class code. If you accidentally create a wrong class, pause and contact the platform owner rather than creating many near-duplicate records.

## 3. Add a privacy-safe roster and issue cards

Select the class under **My classes**. In **Add Mathletes**, paste one privacy-safe display name per line, then select **Add roster and issue cards**. The system accepts line-separated names; commas are also separated automatically. New managed Mathletes receive a unique username and a random six-digit temporary PIN. Existing managed students may be enrolled without showing a new credential.[2]

```text
Amara O.
Jordan C.
Priya S.
```

| Action | Expected result | Next step |
|---|---|---|
| Import a new roster | A green notice reports how many Mathletes were added | Review the active roster and the card panel immediately. |
| New credentials appear | **New Mathlete login cards** show username and temporary PIN | Select **Print cards** or hand each card to the corresponding student privately. |
| An existing student is recognized | The student is enrolled but no PIN is displayed | Confirm the student has their existing card or reset only that student’s PIN. |

> **One-time credential rule:** A new temporary PIN is shown only at account creation or reset time. Print or securely record the card immediately. Do not expect the application to show the original PIN again after leaving the page.[2]

### If a student loses a card

In the selected class’s **Active roster**, find that Mathlete and select **Reset PIN**. Read the confirmation carefully: the previous PIN stops working immediately. Give the replacement card directly to that student; do not reset every student’s PIN because one student needs help.[2]

## 4. Create a classroom Heat

Open **Create a Heat** from the teacher workflow. Choose your prepared class when the class selector appears. A classroom Heat requires a class you manage and at least one active Mathlete on that roster. The selected `class_id` is stored with the Heat and is the basis for the student join gate.[1] [2]

Choose the curriculum, course/topic, question profile, Heat format, duration, and integrity level according to the lesson purpose. For the first operational rehearsal, use a low-stakes **Practice** or classroom-appropriate format. Avoid promising cross-school ranking or formal recognition during this release; flexible benchmark windows and scheduled multi-school events are planned follow-on phases.[1] [2]

| Teacher choice | Good first-rehearsal use | Important note |
|---|---|---|
| Class | The exact prepared class | A student enrolled in another class must not be able to join. |
| Grade cohort | The students’ actual grade | Recognition and peer comparison should remain grade-cohort aware even if prerequisite content is used. |
| Content/topic | Recently taught content or approved prior-grade review | Begin-of-year review may use below-grade content without changing the student’s grade cohort. |
| Format | Practice or other low-stakes class Heat | Start with process reliability before high-stakes competition. |
| Integrity level | Appropriate to your classroom | Explain expectations before opening the lobby. |

## 5. Share the lobby, wait, then start

After creating the Heat, the teacher is its host. The Heat lobby displays a shareable code. Give students the teacher-approved Heat link or code, then let them sign in and wait until each intended participant appears in the lobby.

| What students see | What you should do |
|---|---|
| **Joining Heat…** | Allow a few moments for the secure enrollment check. |
| **You’re in — Waiting for your teacher to start the Heat…** | Confirm the student is listed in the participant panel. |
| A roster/enrollment or sign-in error | Check the student’s managed username/PIN and exact class enrollment; use **Reset PIN** only when needed. |
| A message that the Heat already started | Do not add the student mid-Heat. Create or schedule a new Heat for make-up work. |

The **Start Heat** button is disabled until at least one participant has joined. Once students are ready, select **Start Heat**. The application uses a short countdown, then switches the teacher to the monitoring view while students receive questions. Do not compete as a student from the teacher account.[3]

## 6. During and after the Heat

During an active Heat, stay on the teacher monitoring screen. Supervise according to the school’s normal classroom expectations, help with access problems without viewing answers, and document any integrity issue through the school’s ordinary procedure. Do not share individual student credentials or screenshots of student answers outside the class.

When scoring completes, the teacher sees a results view. Review results as instructional feedback for the initial pilot. If a result seems incorrect, record the Heat code, student display name, and the visible message or behavior; do not edit database records or ask a student to repeat a live competition without school approval.[3]

| Situation | Teacher response |
|---|---|
| Heat finishes normally | Review results and collect operational feedback. |
| Heat remains in **Calculating results…** for several minutes | Refresh once; record the Heat code and report the issue if it persists. |
| Student sees **Session expired** | Have the student sign in again using their card; the Heat link preserves the destination. |
| Lobby sits unused for over 30 minutes | Treat it as expired and create a fresh Heat rather than reusing a stale lobby. |
| Student is not on your roster | Do not bypass the gate. Add/enroll them in the correct class before a future Heat. |

## 7. Teacher end-of-day checklist

| Check | Completion standard |
|---|---|
| Credentials | New cards were handed privately; unused printouts were secured or disposed of under school policy. |
| Roster | The active roster reflects only students who belong in the class. |
| Heat outcome | The Heat code and any access issue are recorded for the pilot coordinator. |
| Feedback | Note timing, question fit, access friction, and student experience. |
| Boundaries | No personal student email or temporary PIN is copied into public materials. |

[1]: ../SPRINT_16B_PLAN.md "Sprint 16B — Three-School Pilot Hierarchy, Provisioning & Authorization"
[2]: ../SPRINT_16C_PLAN.md "Sprint 16C — Class Rosters, Managed Mathlete Access, and Classroom Heats"
[3]: ../../src/app/compete/%5Bcode%5D/page.tsx "Heat lobby and participation implementation"

---

**Hand-off:** Give students [Guide 3 — Student Mathlete Guide](03_STUDENT_MATHLETE_GUIDE.md) or read its short steps aloud before they open the Heat link.
