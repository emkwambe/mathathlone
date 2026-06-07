# CTA Grading Framework
### A Criterion-Referenced Composite for Mathematical Performance Assessment

**Version:** 1.0 — June 2026
**Mpingo Systems LLC**

---

## The Problem with Accuracy Alone

A student scores 100%. But was it knowledge or luck?

Traditional test scoring: `S = correct / total`

Two students both score 80%. One answered only multiple choice. One answered 60% free-response. Same score, different mastery. Accuracy alone cannot differentiate them.

---

## The CTA Score

```
CTA = w₁·C + w₂·T + w₃·A     scaled to [0, 100]

Where:
  C = Content Engagement Score    (what you tackled)
  T = Time Utilization Score      (how you managed the task)
  A = Accuracy Score              (how well you executed)
  
  w₁ = 0.40,  w₂ = 0.30,  w₃ = 0.30
  w₁ + w₂ + w₃ = 1
```

### Component Formulas

```
           FR_correct × 2 + MC_correct × 1
C  =  ──────────────────────────────────────
           FR_total × 2 + MC_total × 1

           questions_attempted     time_per_correct
T  =  ─────────────────────── × ──────────────────
           questions_total         allotted_per_question

           questions_correct
A  =  ───────────────────────
           questions_attempted
```

### What Each Component Measures

**Content (40%)** — Did you engage with hard questions? Free-response is weighted 2× because typing `y = 2x + 3` proves production. Clicking "B" proves recognition. A student who avoids FR and only answers MC gets penalized here even with 100% accuracy.

**Timing (30%)** — Did you use your time well? Not speed alone — coverage and efficiency. Answering 10 of 10 questions in reasonable time scores higher than answering 6 of 10 quickly. It measures whether you attempted the full problem set, not whether you rushed.

**Accuracy (30%)** — Did you get it right? Straightforward: questions_correct / questions_attempted.

### Why the Weights (0.4, 0.3, 0.3)

Content gets 0.40 because WHAT you answered matters most. A student who only answers easy MC questions and gets 100% has NOT demonstrated the same mastery as one who tackled free-response.

Equal weights (0.33 each) would let a fast guesser score the same as a thoughtful problem-solver. The 0.40 content weight ensures knowledge depth dominates over speed or test-taking strategy.

---

## CTA Contextualizes the Score

```
100% Accuracy alone says:   "They got everything right."

CTA 94/100 says:            "They got everything right, AND
                              they engaged with the hard questions (FR, not just MC),
                              they managed their time across all problems,
                              they executed accurately without rushing."

CTA 62/100 with 100% says:  "They got everything right, BUT
                              they only answered MC questions,
                              they skipped 4 questions entirely,
                              they used 14 of 15 minutes on 6 easy problems."
```

A student's CTA score tells the teacher that the percentage isn't all guessing — a measurable portion came from demonstrated knowledge (Content), strategic time management (Timing), and accurate execution (Accuracy).

---

## CTA as a Gradeable Metric

### Criterion-Referenced Proficiency Bands

A ranking just tells you who's first. A gradeable score needs criterion referencing — the score means the same thing regardless of who else took the test.

| CTA Range | Grade | Proficiency Level | Description |
|---|---|---|---|
| 90-100 | A | Mastery | Demonstrated deep understanding across all dimensions |
| 80-89 | B | Proficient | Met standard with minor gaps in coverage or depth |
| 70-79 | C | Developing | Partial understanding, some avoidance of complex questions |
| 60-69 | D | Emerging | Significant gaps in content engagement or execution |
| 0-59 | F | Beginning | Fundamental gaps across multiple dimensions |

These bands are norm-independent. A student scoring 85 means the same thing whether 30 students took the Heat or 1. That makes CTA usable for grades.

### Bloom's Taxonomy Alignment

```
Accuracy alone     → Bloom Level 1-2 (Remember, Understand)
Content weighting  → Bloom Level 3-4 (Apply, Analyze)
                     FR requires production, not recognition
Time utilization   → Bloom Level 5 (Evaluate)
                     Strategic allocation implies metacognition

CTA = f(Remember, Apply, Analyze, Evaluate)
    = multi-level assessment in a single score
```

---

## Competition vs Assessment Modes

MathAthlone operates in two modes:

### Competition Mode (Sprint, Target, Practice, Championship)
- Leaderboard visible
- Streak bonus active
- CTA shown as score out of 100
- Results available immediately
- Formative engagement and gamified practice

### Assessment Mode (Quiz, Test)
- Leaderboard hidden — student sees only their own results
- Streak bonus disabled (multiplier = 1.0)
- CTA displayed as letter grade
- FR/MC ratio: 50/50 for Quiz, 60/40 for Test
- Focus Mode always enforced
- Test results teacher-released
- Criterion-referenced evaluation with gradebook export

| Feature | Competition | Quiz | Test |
|---|---|---|---|
| Leaderboard | Visible | Hidden | Hidden |
| Streak bonus | Active | Disabled | Disabled |
| CTA display | Score/100 | Letter grade | Letter grade |
| FR/MC ratio | 40/60 | 50/50 | 60/40 |
| Focus Mode | By setting | Always on | Locked |
| Results | Immediate | Immediate | Teacher releases |
| Grade mapping | Not shown | CTA → A/B/C/D/F | CTA → A/B/C/D/F |
| Export | CSV | CSV + gradebook | CSV + gradebook |

---

## Grant Language

> The CTA score is a criterion-referenced composite that unifies three orthogonal dimensions of mathematical performance — content engagement (Bloom Levels 3-4), time utilization (metacognitive regulation), and execution accuracy (procedural fluency) — into a single gradeable metric. Unlike raw accuracy, which conflates guessing with mastery, CTA's production-weighted content component (FR × 2) ensures the score reflects demonstrated understanding. The resulting [0, 100] scale maps directly to proficiency bands aligned with NC's achievement level descriptors. In Assessment mode (Quiz, Test), CTA produces gradeable results without additional calibration, while in Competition mode (Sprint, Target, Practice, Championship), the same score drives formative engagement through gamified practice.

> CTA separates students who demonstrated mastery through knowledge, strategy, and execution from those who achieved the same accuracy through pattern recognition and elimination alone.

---

## References

- National Research Council (2001). Adding It Up: Helping Children Learn Mathematics.
- NCTM (2014). Principles to Actions: Ensuring Mathematical Success for All.
- Webb, N. L. (1997). Criteria for Alignment of Expectations and Assessments in Mathematics and Science Education. CCSSO.
- NC DPI (2026). EOG/EOC Test Specifications: Mathematics Achievement Level Descriptors.

---

*Precision tools built to stay. © 2026 Mpingo Systems LLC*
