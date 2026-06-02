# The CTA Scoring Framework
### Content · Timing · Accuracy — A Research-Based Approach to Competitive Math Assessment

**MathAthlone · Mpingo Systems LLC · 2026**

---

## The Problem with Points

Most gamified math platforms rely on what researchers call the **PBL triad** — Points, Badges, and Leaderboards (Werbach & Hunter, 2012). Students accumulate arbitrary point totals (1,946 points, 3,200 points) that have no pedagogical meaning. A teacher cannot look at "1,946 points" and know what a student understands or where they struggle.

Research confirms the concern. Kapp (2012) calls this **"pointsification"** — a limited perspective on gamification that caters only to extrinsic motives. Hanus & Fox (2015) found that adding multiple game elements (badges, leaderboards, coins) to a course actually *reduced* students' motivation and satisfaction. A systematic mapping study of 87 papers found that points, badges, and leaderboards are the game elements most often reported as causing negative effects, including worsened performance, motivational issues, and gaming the system (Toda et al., 2023).

MathAthlone replaces meaningless point accumulation with a three-dimensional performance index grounded in the National Research Council's five strands of mathematical proficiency.

---

## The CTA Framework

MathAthlone's scoring system measures three interdependent dimensions of mathematical performance. Each is scored 0–100 and maps directly to established proficiency standards.

### C — Content (What You Know)

**Measures:** Breadth and depth of mathematical knowledge demonstrated through problem production, not recognition.

**Research basis:** The NRC's *Adding It Up* (2001) defines **conceptual understanding** as "comprehension of mathematical concepts, operations, and relations" and **strategic competence** as "the ability to formulate, represent, and solve mathematical problems." Both are better assessed through constructed response than multiple choice.

Herman et al. (1994) found that students are more likely to use guessing strategies on multiple-choice tests but are more likely to **reason mathematically** on constructive (free-response) tests. Lin & Singh (2016) confirmed that free-response formats facilitate a more accurate understanding of students' thought processes.

**How MathAthlone measures it:** The Content score weights free-response (constructed) answers higher than multiple-choice selections. A student who produces `y = 2x + 3` from scratch demonstrates conceptual understanding, strategic competence, procedural fluency, and communication — four of the five NRC strands in a single response. A student who selects the same answer from four choices demonstrates only recognition.

**Formula:**

```
Content = (free_response_correct × 2 + mc_correct × 1)
        ÷ (free_response_total × 2 + mc_total × 1) × 100
```

### T — Timing (How Efficiently You Execute)

**Measures:** Procedural fluency — the ability to carry out procedures flexibly, accurately, efficiently, and appropriately (NCTM, 2023).

**Research basis:** NCTM defines **procedural fluency** as "the ability to apply procedures efficiently, flexibly, and accurately; to transfer procedures to different problems and contexts." The Common Core Standards for Mathematical Practice reference the NRC's strand of procedural fluency as "skill in carrying out procedures flexibly, accurately, efficiently, and appropriately."

Fluency is not mere speed. It is the observable evidence that a student has internalized strategies deeply enough to deploy them without hesitation. A student who solves `3x + 7 = 22` in 15 seconds has automated the inverse-operation strategy. A student who takes 90 seconds is still consciously retrieving steps — they understand the concept but lack fluency.

**How MathAthlone measures it:** The Timing score rewards both coverage (attempting more questions) and efficiency (solving them faster), while never penalizing careful work below a reasonable threshold.

**Formula:**

```
coverage  = questions_attempted / questions_available
efficiency = max(0, (time_allowed - time_used) / time_allowed)
Timing    = (coverage × 0.6 + efficiency × 0.4) × 100
```

### A — Accuracy (How Precisely You Execute)

**Measures:** Mathematical precision and disciplined problem-solving habits.

**Research basis:** The NRC's *Adding It Up* (2001) identifies that proficient students "check their work" and "catch their own errors." The NCTM's definition of procedural fluency includes the word "accurately" as a core component alongside "efficiently" and "flexibly." Accuracy in MathAthlone specifically tracks **first-touch correctness** — whether a student arrives at the correct answer on their first attempt without revision.

First-touch accuracy is pedagogically significant because it distinguishes between a student who has genuine understanding (gets it right the first time) and one who uses trial-and-error or test-taking strategies (submits multiple attempts). In high-stakes competition, there is no second attempt — first-touch accuracy mirrors real exam conditions.

**How MathAthlone measures it:**

```
Accuracy = first_touch_correct / questions_attempted × 100
```

---

## The Composite: Why C × T × A Are Interdependent

The three dimensions are interwoven, exactly as the NRC describes its five strands:

> *"The five strands are interwoven and interdependent in the development of proficiency."*
> — Adding It Up, National Research Council (2001)

A student with high Content but low Timing knows the material but cannot execute efficiently — they need fluency practice. A student with high Timing but low Accuracy rushes through problems without discipline — they need to develop checking habits. A student with high Accuracy but low Content is precise on what they know but hasn't covered enough ground — they need broader exposure.

**The CTA composite:**

```
CTA = Content × 0.40 + Timing × 0.30 + Accuracy × 0.30
```

The 40/30/30 weighting reflects that **knowing the mathematics is the most important factor**, while efficiency and precision are equally important supporting competencies.

| CTA Profile | C | T | A | Coaching implication |
|---|---|---|---|---|
| Strong all-round | 85 | 80 | 88 | Championship-ready. Maintain and challenge. |
| Knows material, slow | 82 | 45 | 80 | Needs fluency drills. Timed practice on familiar content. |
| Fast but sloppy | 55 | 90 | 40 | Rushes. Needs to slow down, check work, build precision habits. |
| Precise but narrow | 50 | 50 | 92 | Careful student who hasn't covered enough. Needs broader exposure. |
| Guessing strategy | 30 | 85 | 25 | Using MC elimination, not mathematical reasoning. Needs free-response practice. |

---

## Why Free-Response Matters More Than Multiple Choice

The overreliance on multiple choice in math EdTech creates a measurable distortion. When a student sees four answer choices, they engage a *recognition* process (25% guess probability). When they see a blank input, they engage a *production* process (0% guess probability).

Research consistently supports this distinction:

- Herman et al. (1994): Students use **guessing strategies** on MC but **reason mathematically** on constructed-response tests.
- Penn State study (cited in "Talking About Thinking," 2018): Free responses are a better assessment of deeper understanding because "the answer is completely student-generated and cannot use recognition."
- Bloom's Taxonomy: MC primarily assesses lower levels (remember, understand). Free-response assesses higher levels (apply, analyze, evaluate, create).
- Lin & Singh (2016): Free-response "facilitates a more accurate understanding of students' thought processes" and allows partial credit for displaying different levels of understanding.

MathAthlone's CTA framework operationalizes this research by **doubling the Content weight** of free-response correct answers. This creates a measurable incentive for students to develop genuine mathematical proficiency rather than test-taking strategies.

---

## How CTA Differs from Arcade Scoring

| Dimension | Arcade scoring (typical EdTech) | CTA Framework (MathAthlone) |
|---|---|---|
| **What it measures** | Activity volume | Mathematical proficiency |
| **Primary metric** | Points accumulated | Three-dimensional performance profile |
| **Free-response vs MC** | Treated equally | Free-response weighted 2× for Content |
| **Pedagogical meaning** | "1,946 points" = nothing actionable | "C:82 T:45 A:80" = "knows material, needs speed" |
| **Teacher utility** | None | Diagnostic coaching profile per student |
| **Research basis** | None | NRC five strands, NCTM procedural fluency, Bloom's Taxonomy |
| **Gaming resistance** | Easy to game (spam answers for points) | Penalizes guessing (Accuracy), rewards depth (Content) |

---

## Implementation in MathAthlone

Every Heat produces a CTA profile for each participant. Teachers see:

1. **Individual CTA breakdown** — C, T, and A scores with coaching implications
2. **Concept mastery heatmap** — which topics are mastered (≥80%), developing (60–80%), or need work (<60%)
3. **Award bands** — Participation (<60% accuracy), Bronze (70–80th percentile), Silver (80–90th), Gold (90–96th), Platinum (96–99th), Champion (99–100th)

The award system uses **percentile ranking within division** among students who meet the 60% accuracy eligibility threshold, ensuring that awards reflect genuine mathematical achievement rather than participation volume.

---

## References

Hanus, M. D., & Fox, J. (2015). Assessing the effects of gamification in the classroom. *Computers & Education*, 80, 152–161.

Herman, J. L., Klein, D. C. D., & Abedi, J. (1994). Assessing students' opportunity to learn: Teacher and student perspectives. *Educational Measurement: Issues and Practice*, 13(4), 16–24.

Kapp, K. M. (2012). *The Gamification of Learning and Instruction*. Pfeiffer.

Lin, S.-Y., & Singh, C. (2016). Can Free-Response Questions Be Approximated by Multiple-Choice Equivalents? *arXiv preprint arXiv:1609.00018*.

National Council of Teachers of Mathematics. (2023). Procedural Fluency in Mathematics: A Position of the National Council of Teachers of Mathematics.

National Research Council. (2001). *Adding It Up: Helping Children Learn Mathematics*. Washington, DC: The National Academies Press.

Seaborn, K., & Fels, D. I. (2015). Gamification in theory and action: A survey. *International Journal of Human-Computer Studies*, 74, 14–31.

Toda, A. M., et al. (2023). Negative Effects of Gamification in Education Software: Systematic Mapping and Practitioner Perceptions. *arXiv preprint arXiv:2305.08346*.

Werbach, K., & Hunter, D. (2012). *For the Win: How Game Thinking Can Revolutionize Your Business*. Wharton Digital Press.

---

*Precision tools built to stay. © 2026 Mpingo Systems LLC*
