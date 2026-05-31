# MathAthlone — Open Platform Architecture & Vision

**Version:** 1.0 — Deep Research Edition
**Date:** May 31, 2026
**Author:** Eddy Mkwambe / Mpingo Systems LLC
**Role:** Chief Architect, Systems Researcher

---

## Executive Thesis

MathAthlone is not a school tool. It is a **global math competition platform** that schools also use.

The difference matters. A school tool lives and dies by district sales cycles. A global platform grows through individual adoption, viral competition, and always-available play — and then schools, homeschool families, TikTok educators, tutoring centers, and organized groups all find their way in because their students are already competing.

**The model is Chess.com, not Kahoot.**

---

## Part 1: The Market MathAthlone Actually Serves

### 1.1 Three audiences, one platform

| Audience | Size | How they find us | What they need |
|---|---|---|---|
| **Schools** (teachers, admins) | 130,000+ US schools, 50M+ K-12 students | Teacher discovers via colleague, conference, or student demand | Curriculum alignment, analytics, integrity, institutional controls |
| **Homeschool families** | 5–8M US students, $7.35B market (2025), 7% CAGR | Parent searching for structured math practice + socialization | Standards-mapped content, peer competition their kids don't normally get, co-op friendly |
| **Independent learners** | Global, untapped | TikTok math teachers (1M+ followers each), YouTube educators, tutoring centers, self-motivated students | Always-available competition, global leaderboard, country representation, no institutional gatekeeping |

### 1.2 Why "school-only" leaves money and impact on the table

The school-only model has three structural weaknesses:

1. **Summer churn.** Schools close May–August. A school-only platform loses 3 months of engagement every year. Chess.com doesn't close in summer.

2. **Sales cycle friction.** Selling to schools takes 3–12 months (pilot → committee → budget approval → procurement). Individual adoption takes 30 seconds (sign up → join a Heat).

3. **The best distribution is students, not admins.** When a student says "I'm ranked #47 nationally in MathAthlone," their teacher investigates. When a teacher demos it, their principal notices. Bottom-up adoption is faster and stickier than top-down sales.

### 1.3 The Chess.com playbook

Chess.com built a $100M+ revenue business with 200M registered users using this exact model:

- **Always available.** You can play chess right now, against anyone in the world, at any skill level. No teacher needs to set it up.
- **Free is genuinely useful.** Unlimited games, puzzles, basic analysis. You never need to pay to play.
- **Premium unlocks depth.** Advanced analysis, lessons, no ads, unlimited puzzles. ARPU: $80–110/year.
- **Schools are a segment, not the product.** Chess.com for Schools lets teachers create classrooms, assign puzzles, track progress — but the core platform doesn't depend on schools.
- **Community drives growth.** Tournaments, clubs, streamers, content creators. The platform is social.

MathAthlone should follow this exact pattern for math competition.

---

## Part 2: Always-On Global Heats

### 2.1 The core idea

Every 20–30 minutes, MathAthlone auto-launches a global Heat. Anyone with a free account can join. You represent your country. The Heat runs on curriculum-standard math (not tricks). Results feed into a global practice leaderboard.

This is the **"Play" button** — the reason someone opens MathAthlone at 9pm on a Tuesday when no teacher assigned anything.

### 2.2 How it works

```
┌──────────────────────────────────────────────────────────────┐
│               GLOBAL HEAT LIFECYCLE (AUTO-RUN)               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SCHEDULING                                               │
│     Cron job creates next Heat 5 min before start            │
│     Picks topic from rotating cycle (Mon=Algebra,            │
│     Tue=Geometry, Wed=Statistics, etc.)                      │
│     Difficulty auto-selected by division                     │
│                                                              │
│  2. LOBBY (5 min window)                                     │
│     "Next Global Heat starts in 4:32"                        │
│     Players join from homepage or /compete                   │
│     Matchmaking groups by division (Rising Stars,            │
│     Challengers, Contenders, Varsity)                        │
│     Shows participant count + country flags                  │
│                                                              │
│  3. COUNTDOWN (10 seconds)                                   │
│     All participants synced to server clock                  │
│     "3... 2... 1... GO!"                                     │
│                                                              │
│  4. ACTIVE (15–20 min)                                       │
│     Standard Heat mechanics (CTA scoring)                    │
│     Focus Mode: light (practice level)                       │
│     Live position updates (top 10 visible)                   │
│                                                              │
│  5. RESULTS                                                  │
│     Full leaderboard with country flags                      │
│     ELO adjustment (practice K-factor: 16)                   │
│     "Share your result" social card                          │
│     "Next Heat starts in 18 minutes"                         │
│                                                              │
│  6. REPEAT                                                   │
│     Next Heat auto-scheduled                                 │
│     24/7, 365 days/year                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Topic rotation schedule

| Day | Topic focus | Why |
|---|---|---|
| Monday | Linear equations | Start the week with fundamentals |
| Tuesday | Geometry & measurement | Visual thinking day |
| Wednesday | Statistics & probability | Data reasoning |
| Thursday | Quadratics & polynomials | Challenge day |
| Friday | Mixed review | Competition prep |
| Saturday | Student's choice (voted) | Community engagement |
| Sunday | Special event / themed | Retention hook |

### 2.4 Division-based matchmaking

Global Heats auto-group by division so a Grade 4 student isn't competing against a Math 1 student:

| Division | Grade band | Depth range | Heat cadence |
|---|---|---|---|
| Rising Stars | 3–5 | 1–2 | Every 30 min |
| Challengers | 6–7 | 2–3 | Every 30 min |
| Contenders | 8–9 | 3–4 | Every 20 min |
| Varsity | Math 1+ | 3–4 | Every 20 min |

Higher divisions run more frequently because demand is higher (competitive students play more).

### 2.5 Country representation

Every account has a country flag (from profile or IP geolocation). In global Heats:

- Display name shows: **Amara O. 🇺🇸**
- Results show country breakdown: "USA: 47 mathletes · Nigeria: 12 · UK: 8"
- Weekly country leaderboard: "Top countries this week"
- Annual "Math Nations Cup" event

This creates pride, virality, and a reason for international students to participate.

### 2.6 Gating: Global Heats as qualification criteria

Global Heat participation and performance can serve as prerequisites for advancing in the formal competition path:

| Advancement from | Requirement |
|---|---|
| Classroom → School | Teacher invitation (no global requirement) |
| School → District | Minimum 10 global Heats played + ELO > 1200 |
| District → Regional | Minimum 25 global Heats + ELO > 1400 |
| Regional → State | Minimum 50 global Heats + ELO > 1600 |
| State → National | By qualification only |

This ensures that students who advance have proven themselves across many sessions, not just one lucky day.

---

## Part 3: Serving Every Learner

### 3.1 The TikTok teacher

**Who they are:** 1M+ follower math educators on TikTok/YouTube/Instagram. Mrs. Kelly (@the_mrskelly), Mr. Numbers, Math with Maddox, etc. Educational content is the second most popular TikTok category (16.1% of all views).

**What they need:** A platform to direct their audience to. TikTok pays $0.02–0.05 per 1,000 views. A 500K-view video earns ~$25. But directing those viewers to MathAthlone where they sign up, compete, and potentially subscribe? That's $59/year per conversion.

**MathAthlone for creators:**
- **Affiliate program:** Creator gets 20% of any Pro subscription from their referral link for 12 months. At $59/year, that's $11.80/referral.
- **Custom Heat links:** Creator can schedule a themed Heat ("Mrs. Kelly's Friday Fraction Frenzy") and share the join link on TikTok.
- **Branded leaderboards:** "Mrs. Kelly's Top Mathletes This Week" — visible on creator's profile page.
- **Content hooks:** Every Heat result generates a shareable social card that tags the platform.

A creator with 100K followers converting 0.5% = 500 Pro subscribers = $29,500/year in subscription revenue + $5,900/year in affiliate payouts. Both sides win.

### 3.2 The homeschool family

**Who they are:** 5–8M US students, parents spending $7.35B/year on curriculum and tools. Growing at 7%+ CAGR. ESA/voucher programs in 17 states subsidize purchases.

**What they need:** Peer competition. Homeschool kids often lack the social competitive pressure that makes practice engaging. Co-ops provide some, but scheduling is hard. MathAthlone's always-on global Heats solve this.

**MathAthlone for homeschool:**
- **No school required.** Sign up as an individual or family. Pick your division.
- **Co-op mode:** A homeschool co-op leader can create a "classroom" group, run teacher-initiated Heats, track analytics — exactly like a school teacher.
- **Family plan:** 2–4 kids, one parent dashboard, $99/year (vs $59×4 = $236 individually).
- **State homeschool association partnerships:** Bulk licensing at school rates for registered co-ops.
- **ESA/voucher compatible:** Accepted as a qualified educational expense in participating states.

### 3.3 The tutoring center / learning pod

**Who they are:** Kumon, Mathnasium, Sylvan, and thousands of independent tutors. Also the growing "learning pod" market (small groups of families sharing a tutor post-COVID).

**What they need:** Engagement tools that make drill practice competitive. Assessment data they can show parents.

**MathAthlone for tutors:**
- **Tutor dashboard:** Same as teacher dashboard, but branded as "Tutor" or "Coach."
- **Client reports:** Auto-generated progress reports tutors can share with parents.
- **Group competition:** Run Heats between students from the same center.
- **Pricing:** Pro plan ($59/year) for individual tutors. Center plan at school pricing ($4/student/year).

### 3.4 The self-motivated student

**Who they are:** The kid who plays chess on their phone, watches 3Blue1Brown, and wants to know if they're good at math. No teacher or parent is pushing them — they're intrinsically motivated.

**What they need:** A leaderboard. A rating. A reason to come back tomorrow.

**MathAthlone for the self-motivated:**
- **Free forever for individual play.** Global Heats, ELO rating, country leaderboard.
- **Profile page:** Rating, division, country, Heat history, badges, streak.
- **Social:** Follow other mathletes. See when friends are competing. Challenge to 1v1.
- **Progression:** Unlock division promotions by sustained performance.
- **Path to formal competition:** "Your ELO qualifies you for District-level events. Ask your school to register."

---

## Part 4: Revised Business Model

### 4.1 Revenue streams for an open platform

| Stream | Source | Year 1 est. | Year 3 est. |
|---|---|---|---|
| **Pro subscriptions** (individuals) | Teachers, parents, tutors, serious students | $35K | $500K |
| **Family plans** | Homeschool families (2–4 kids) | $10K | $200K |
| **School licenses** | Schools, co-ops | $40K | $1.05M |
| **District licenses** | Districts | $25K | $1.05M |
| **Tournament fees** | Formal competition registration | $7K | $135K |
| **Creator affiliates** | TikTok/YouTube educator referrals | $0 | $75K |
| **Sponsorships** | Corporate sponsors for events | $0 | $300K |
| **Merchandise** | Champion gear, school branded items | $0 | $150K |
| **Total** | | **$117K** | **$3.46M** |

### 4.2 Updated pricing tiers

| Tier | Price | Who |
|---|---|---|
| **Free** | $0 | Anyone. Global Heats, basic ELO, classroom practice |
| **Pro** | $7/mo or $59/yr | Teachers, tutors, serious students. Full analytics, leagues, all integrity levels |
| **Family** | $99/yr | 2–4 kids + parent dashboard. Homeschool optimized |
| **School** | $4/student/yr | Whole school, admin dashboard, SSO |
| **District** | $2.50/student/yr | All schools in district, cross-school leagues |
| **Creator** | Free + 20% affiliate | Content creators driving signups |

### 4.3 What's free vs. paid

| Feature | Free | Pro/Family | School/District |
|---|---|---|---|
| Global auto-Heats | ✓ | ✓ | ✓ |
| ELO rating + profile | ✓ | ✓ | ✓ |
| Country leaderboard | ✓ | ✓ | ✓ |
| 3 classrooms | ✓ | ✓ | ✓ |
| Practice integrity level | ✓ | ✓ | ✓ |
| Unlimited classrooms | — | ✓ | ✓ |
| League standings + brackets | — | ✓ | ✓ |
| All integrity levels | — | ✓ | ✓ |
| Analytics dashboard | — | ✓ | ✓ |
| CSV export | — | ✓ | ✓ |
| School-wide leagues | — | — | ✓ |
| District cross-school | — | — | ✓ (District) |
| Admin dashboard + SSO | — | — | ✓ |
| Custom reports | — | — | ✓ |

The free tier is the "Play" button. It must feel complete, not crippled.

---

## Part 5: Technical Architecture for Global Heats

### 5.1 Auto-scheduling system

```typescript
// Edge function: runs every 5 minutes via Supabase pg_cron
// Creates the next global Heat for each division

interface GlobalHeatConfig {
  division: string;
  cadence_minutes: number;
  topic_cycle: string[];      // rotates daily
  depth_min: number;
  depth_max: number;
  duration_seconds: number;
  question_count: number;
}

const GLOBAL_CONFIGS: GlobalHeatConfig[] = [
  {
    division: 'rising_stars',
    cadence_minutes: 30,
    topic_cycle: ['linear_equations', 'geometry', 'statistics', 'fractions', 'mixed'],
    depth_min: 1, depth_max: 2,
    duration_seconds: 900,    // 15 min
    question_count: 15,
  },
  {
    division: 'challengers',
    cadence_minutes: 30,
    topic_cycle: ['linear_equations', 'geometry', 'statistics', 'ratios', 'mixed'],
    depth_min: 2, depth_max: 3,
    duration_seconds: 900,
    question_count: 20,
  },
  {
    division: 'contenders',
    cadence_minutes: 20,
    topic_cycle: ['quadratics', 'systems', 'geometry', 'statistics', 'mixed'],
    depth_min: 3, depth_max: 4,
    duration_seconds: 1200,   // 20 min
    question_count: 20,
  },
  {
    division: 'varsity',
    cadence_minutes: 20,
    topic_cycle: ['quadratics', 'exponentials', 'systems', 'polynomials', 'mixed'],
    depth_min: 3, depth_max: 4,
    duration_seconds: 1200,
    question_count: 25,
  },
];
```

### 5.2 Database additions

```sql
-- Global Heats table extension
ALTER TABLE heats
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS division_code TEXT,           -- 'rising_stars', etc.
  ADD COLUMN IF NOT EXISTS auto_scheduled BOOLEAN DEFAULT false;

-- Index for finding the next available global Heat
CREATE INDEX IF NOT EXISTS idx_heats_global_lobby
  ON heats(division_code, status, scheduled_at)
  WHERE is_global = true;

-- Country tracking on user profiles
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS country_flag TEXT DEFAULT '🏳️';

-- Global leaderboard materialized view (by country)
CREATE MATERIALIZED VIEW IF NOT EXISTS country_leaderboard AS
SELECT
  u.country_code,
  u.country_flag,
  COUNT(DISTINCT u.id) AS total_mathletes,
  AVG(ar.rating) AS avg_rating,
  MAX(ar.rating) AS top_rating,
  SUM(ar.games_played) AS total_heats_played
FROM users u
  JOIN athlete_ratings ar ON u.id = ar.athlete_id
WHERE u.role = 'athlete'
  AND ar.games_played >= 3
GROUP BY u.country_code, u.country_flag
ORDER BY avg_rating DESC;
```

### 5.3 Homepage "Next Heat" widget

The homepage should always show when the next global Heat starts:

```
┌─────────────────────────────────────────────────────┐
│  🔥 NEXT GLOBAL HEAT                               │
│                                                     │
│  Division: Contenders (Grades 8-9)                  │
│  Topic: Quadratic Equations                         │
│  Starts in: 4:32                                    │
│                                                     │
│  47 mathletes waiting · 12 countries                │
│  🇺🇸 🇳🇬 🇬🇧 🇮🇳 🇰🇪 🇨🇦 🇿🇦 🇦🇺 🇧🇷 🇯🇵 🇩🇪 🇫🇷          │
│                                                     │
│  [ JOIN NOW ]                                       │
│                                                     │
│  ─── Other divisions starting soon ───              │
│  Rising Stars (3-5): 12 min                         │
│  Challengers (6-7): 12 min                          │
│  Varsity (Math 1+): 8 min                           │
└─────────────────────────────────────────────────────┘
```

### 5.4 Social sharing

After every Heat, generate a shareable card:

```
┌─────────────────────────────────────────────┐
│  🏟️ MATHATHLONE                            │
│                                             │
│  Amara O. 🇺🇸                               │
│  #12 of 89 mathletes                        │
│  CTA Score: 847 · ELO: 1,623               │
│  Division: Contenders                       │
│                                             │
│  Topic: Quadratic Equations                 │
│  Accuracy: 85% · Avg time: 34s             │
│                                             │
│  Can you beat my score?                     │
│  mathathlone.com/join                       │
└─────────────────────────────────────────────┘
```

This card is designed for Instagram stories, TikTok, and Twitter. It's the viral loop.

---

## Part 6: Value Delivery — What Makes Decision-Makers Act

### 6.1 For school decision-makers

School principals and curriculum directors don't buy tools. They buy outcomes.

| Outcome they want | How MathAthlone delivers | Evidence they need |
|---|---|---|
| Improved math scores | Spaced practice on standards-aligned content, 54+ generators | Concept mastery reports mapped to state standards |
| Student engagement | Competition, ELO ratings, school pride, leaderboards | Usage data: Heats per week, time-on-task, return rate |
| Teacher time savings | Auto-generated questions, auto-graded, auto-analyzed | "Zero prep time" — teacher clicks one button |
| MTSS/RTI data | Gap analysis by standard, per-student | Exportable reports for intervention planning |
| Parent communication | Student profiles with progress tracking | Shareable progress snapshots |

The sales conversation isn't "buy our platform." It's "your students are already competing on MathAthlone. Here's what a school license gives you on top of that."

### 6.2 For homeschool parents

| What they want | How MathAthlone delivers |
|---|---|
| Structured math practice | Standards-mapped content, difficulty tiers |
| Peer interaction | Global Heats with kids their age, worldwide |
| Accountability | Daily streak, ELO progression, parent dashboard |
| Assessment evidence | Concept mastery reports for portfolio/umbrella school |
| Affordability | Free for basics, $99/yr family plan |

### 6.3 For TikTok/YouTube educators

| What they want | How MathAthlone delivers |
|---|---|
| Monetize their audience | 20% affiliate on Pro subscriptions ($11.80/referral) |
| Engage their community | Custom Heats with their branding |
| Create content hooks | Heat results, leaderboards, challenges = content fodder |
| Look professional | "I use MathAthlone with my students" = credibility |

### 6.4 For students (the real customer)

| What they want | How MathAthlone delivers |
|---|---|
| To feel good at something | ELO rating that goes UP when they practice |
| Competition without exclusion | Everyone can play, divisions match your level |
| Recognition | Medals, streaks, leaderboards, school representation |
| Fairness | Integrity system ensures results are earned |
| Fun | It's literally a sport — with a countdown, a score, and a winner |

---

## Part 7: Competitive Moat

### 7.1 Why this is hard to copy

1. **Question generators are IP.** 54+ procedural generators producing infinite standards-aligned variations. This took months of math education expertise to build. Kahoot has no math-specific content engine.

2. **League infrastructure is deep.** Swiss pairing, ELO/Glicko-2, double elimination, championship points, advancement rules, integrity tiering — this is 10,000+ lines of production code. No competitor has this for math.

3. **The network effect is real.** Once schools in a district are competing against each other on MathAthlone, switching costs are enormous. You'd have to convince every school to switch simultaneously.

4. **Always-on global Heats create habit.** Daily active usage is the strongest predictor of retention and conversion. Kahoot is event-driven (teacher must create). MathAthlone is always running.

5. **Identity scaling is emotional.** Representing your school at Districts, your state at Nationals — that's pride. That's a story parents share. That's the kind of engagement that survives budget cuts.

### 7.2 What could kill us

| Threat | Likelihood | Response |
|---|---|---|
| Kahoot adds math leagues | Low (they're general-purpose) | Move fast, build community, deepen math-specific features |
| MATHCOUNTS goes digital | Medium | Position as complementary pipeline, not replacement |
| Khan Academy adds competition | Low (mission conflict) | Different value prop — Khan is self-paced, we're competitive |
| A well-funded startup copies | Medium | First-mover in always-on math competition with integrity = 18+ months ahead |

---

## Part 8: Implementation Roadmap

### Phase 1: Fix & Ship (Week 1–2)
- [ ] Fix RLS recursion on heats table
- [ ] Heat creation working end-to-end
- [ ] Student join flow tested
- [ ] Landing page with pricing section
- [ ] Stripe integration (Free + Pro tiers)

### Phase 2: Global Heats MVP (Week 3–6)
- [ ] Auto-scheduling cron job (pg_cron or Supabase Edge Function)
- [ ] Division-based matchmaking
- [ ] "Next Heat" homepage widget
- [ ] Country flag on profiles
- [ ] Social sharing cards
- [ ] Global practice leaderboard

### Phase 3: Open Platform (Week 7–10)
- [ ] Family plan signup + parent dashboard
- [ ] Creator affiliate program (referral tracking)
- [ ] Co-op / tutor registration path
- [ ] Homeschool onboarding flow (no school required)
- [ ] Country leaderboard

### Phase 4: School Features (Week 11–14)
- [ ] School license management
- [ ] Admin dashboard
- [ ] Concept mastery reports (exportable)
- [ ] SSO integration (Google, Clever)
- [ ] District sales materials + pilot program

### Phase 5: Competition Series (Week 15–20)
- [ ] Tournament registration flow
- [ ] Formal bracket generation for events
- [ ] State championship pilot (NC)
- [ ] Sponsorship outreach with data
- [ ] First national event planning

---

## Part 9: The One-Liner

**MathAthlone is Chess.com for math — an always-on global competition platform where any student can compete on curriculum-standard problems, earn ratings, represent their school and country, and advance from classroom practice to national championships.**

Not just for "math kids." For everyone.

---

## Appendix: Research Sources

| Source | Key data point |
|---|---|
| Chess.com (hey.gg interview) | $0 to $100M revenue, 200M users, 20M games/day |
| Chess market report (dataintelo.com) | $3.45B market, ARPU $80–110/yr, 9.28% CAGR |
| ChessKid | 10M registered kids on Chess.com's children's platform |
| Duolingo 10-K (2025) | $1.04B revenue, 39% growth, 9% free→paid conversion |
| Duolingo Q2 2025 | $210.7M subscription revenue, 46% YoY growth |
| US Homeschool market (Metastat) | $7.35B (2025), 7% CAGR, 7.9M students |
| Homeschool curriculum market | $45.6B (2026), 15% CAGR |
| TikTok education (Mega Digital) | 16.1% of views are educational content |
| TikTok creator RPM | $0.02–0.05 per 1K views for educational content |
| MATHCOUNTS registration | $40–45/student school, $70 NSC |
| Kahoot pricing (Vendr, Wooclap) | $3–27.50/mo teacher, $15–25/mo school |
| IXL pricing | $9.95–19.95/mo family, ~$5/student district |
| Blooket pricing | $2.99–4.99/mo teacher, $3,000/yr school (80 teachers) |
| EdTech market (GlobalData) | $410B by 2026, 16% CAGR |

---

*Precision tools built to stay. © 2026 Mpingo Systems LLC*
