# MathAthlone Pilot Test Guide
### Credentials & Quick-Start Instructions

**Date:** June 2026 · **Platform:** mathathlone.vercel.app · **Mpingo Systems LLC**

---

## Test Accounts

| # | Name | Email | Password | Role |
|---|---|---|---|---|
| 1 | **Ms. Hodges** | `mshodges@mathathlone.dev` | `TestHeat2026!` | Teacher |
| 2 | **Mr. Mkwambe** | `mrmkwambe@mathathlone.dev` | `TestHeat2026!` | Teacher |
| 3 | **Amara Osei** | `student1@mathathlone.dev` | `TestHeat2026!` | Student (G9) |
| 4 | **Jordan Chen** | `student2@mathathlone.dev` | `TestHeat2026!` | Student (G10) |
| 5 | **Priya Sharma** | `student3@mathathlone.dev` | `TestHeat2026!` | Student (G8) |

**Backup accounts** (password: `devpass123`):

| Name | Email | Role |
|---|---|---|
| Dev Teacher | `dev.teacher@test.com` | Teacher |
| Dev Mathlete G7 | `dev.mathlete.g7@test.com` | Student (G7) |
| Dev Mathlete G10 | `dev.mathlete.g10@test.com` | Student (G10) |

---

## Quick-Start: Running a Heat (5 minutes)

### Step 1 — Teacher Creates the Heat

1. Go to **mathathlone.vercel.app/auth/login**
2. Sign in as **Ms. Hodges** (or any teacher account)
3. Navigate to **mathathlone.vercel.app/compete/create**
4. Choose:
   - **Division:** Junior Varsity (Grades 9-10) or Advanced (Grades 7-8)
   - **Course:** NC Math 1 (auto-selected)
   - **Topic:** Pick a specific topic OR "Mixed (all topics)"
   - **Difficulty:** Silver (recommended for pilot)
   - **Heat Type:** Sprint (15 min, 20 questions) or Target (20 min, 10 questions)
   - **Integrity:** Practice (recommended for pilot)
5. Click **Create Heat**
6. You'll see a **6-character code** (e.g., MA-7X4K) — share this with students

### Step 2 — Students Join

1. Each student opens **mathathlone.vercel.app/compete** on their device
2. Sign in with their student account
3. Enter the **Heat code** the teacher shared
4. They'll see "You're in — Waiting for teacher to start"

### Step 3 — Teacher Starts the Heat

1. On the teacher's screen, verify all students appear in the lobby
2. Click **Start Heat**
3. A 5-second countdown syncs everyone

### Step 4 — Students Compete

- Questions appear one at a time (mix of typed answers + multiple choice)
- **Format hints** appear below typed answers (e.g., "Format: y = mx + b")
- Timer counts down in the top-right corner
- Students see their progress: "Correct: 7/14"

### Step 5 — Teacher Ends the Heat

- Click **End Heat Early** when ready, OR let the timer expire
- Results calculate automatically (5-10 seconds)

### Step 6 — View Results

**Students see:**
- Personal award (Participation / Bronze / Silver / Gold / Platinum / Champion)
- CTA Score out of 100 (Content × Timing × Accuracy)
- Accuracy %, Time, Correct count, Best Streak, Concepts Mastered
- Leaderboard position
- Question-by-question review (what they got right/wrong)

**Teacher sees:**
- Class overview: average accuracy, average CTA, participant count
- Award distribution (how many of each medal)
- **Concept mastery heatmap** — which topics students mastered vs need work
- Full leaderboard with drill-down per student
- CSV export button for records

---

## What to Observe During the Pilot

### Student Engagement
- [ ] Do students understand how to enter the Heat code?
- [ ] Do they read the format hints before typing answers?
- [ ] Are they engaged during the competition (watching timer, tracking streaks)?
- [ ] Do they check the question review after results?

### Question Quality
- [ ] Are questions mathematically correct?
- [ ] Are the format hints clear enough? (Did anyone type the right answer in the wrong format?)
- [ ] Is the difficulty appropriate for the grade level?
- [ ] Are visual/graph questions rendering properly on student devices?

### Teacher Experience
- [ ] Was creating a Heat intuitive (under 60 seconds)?
- [ ] Does the live monitor show real-time progress?
- [ ] Is the concept mastery heatmap useful for identifying gaps?
- [ ] Would you use the CSV export for your records?

### Technical
- [ ] Any page loading issues? (Note which page and device)
- [ ] Any errors displayed? (Screenshot if possible)
- [ ] Does the lobby update when students join? (Realtime)
- [ ] Does the countdown sync across devices?

---

## Recommended Pilot Schedule

| Session | Heat Type | Topic | Duration | Purpose |
|---|---|---|---|---|
| **Session 1** | Target (10Q, 20min) | Mixed topics | 25 min total | Warm-up, learn the interface |
| **Session 2** | Sprint (20Q, 15min) | Specific topic | 20 min total | Focused practice, test concept mastery |
| **Session 3** | Sprint (20Q, 15min) | Different topic | 20 min total | Compare results across topics |

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Invalid login credentials" | Check email spelling. Password is `TestHeat2026!` (case-sensitive, with `!`) |
| Page stuck on "Loading..." | Refresh the browser. If still stuck, clear cookies and log in again |
| Student can't join | Verify they entered the code correctly (codes look like MA-7X4K) |
| "Something went wrong" error | Note the error message, screenshot it, and continue with a new Heat |
| Questions not displaying | Try a different browser. Chrome or Edge recommended |

**Support contact:** eddy@mpingosystems.com

---

*Precision tools built to stay. © 2026 Mpingo Systems LLC*
