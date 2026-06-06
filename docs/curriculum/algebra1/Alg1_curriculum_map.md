# Algebra 1 — MathAthlone Curriculum Map
**Course:** Algebra 1  
**MathAthlone Division:** Varsity  
**Pool ID:** `algebra_1` (fully isolated — no shared generator IDs with `nc_math_1` or any other pool)  
**Standards:** CCSS A-REI, F-IF, F-BF, F-LE, A-SSE, A-APR, A-CED, N-RN, S-ID

**Total Atomic Concepts:** 99  
**Group A (Generator-Suitable):** 58  
**Group B (Static-Only):** 14  
**Hybrid (A + B):** 27  
**Projected Generator Count:** 82 (≥40 minimum ✅)  
**Visual Generator Flags:** 24 concepts

---

## Division Context

Algebra 1 sits at the **Varsity** tier alongside NC Math 1. The two pools are **parallel lanes** — same division, different curriculum source. A Mathlete in a CCSS-aligned school uses `algebra_1`; a Mathlete in an NC school uses `nc_math_1`. Heat creation UI should surface which pool is active based on the school's curriculum setting.

Algebra 1 is also the **most direct feeder** into:
- Algebra 2 (every unit has a direct continuation)
- AP Pre-Calculus (functions, exponential models, polynomial graphs)
- AP Calculus AB (function concepts, limits setup, exponential derivatives)

---

## MF Prerequisite Map (Critical Gaps to Flag)

| Algebra 1 Unit | Required MF Concepts | If Missing → |
|---------------|---------------------|--------------|
| FND | MF.AP (all properties), MF.ANT.3 (PEMDAS), MF.RPBA.3 (one-step equations) | Cannot set up or solve any algebraic expression |
| FLF | MF.RPBA.1–2 (ratio/rate = slope foundation), MF.GEO.1 (area/perimeter grounds coordinate intuition) | Cannot interpret slope as rate of change |
| SYS | FLF complete, MF.SETS.2 (solution = intersection) | Cannot recognize consistent/inconsistent systems |
| EXP | MF.ER.1–2 (all exponent laws), MF.FDP (rational number fluency for decay fractions) | Cannot simplify exponential expressions |
| POLY | MF.AP.3 (distributive), MF.ANT.2 (GCF factoring), MF.ER.1.2 (product rule) | Cannot factor or multiply polynomials |
| QUAD | POLY complete, MF.ER.2 (square roots), MF.RAD.1 (radical simplification for quadratic formula) | Cannot solve quadratic equations |
| DAS | MF.S.1–2 (mean/median/IQR), Grade 8 SP (scatter plots) | Cannot compute or interpret regression |

---

## EXP.1.x vs MF.ER Overlap Resolution

Alg1.EXP.1.1–1.5 covers the same exponent laws as MF.ER.1.1–1.7.  
**Key distinction:** MF.ER uses **numeric bases**; Alg1.EXP uses **variable and mixed bases** with multi-term expressions.  
Generator params are escalated accordingly. No shared IDs between pools.

---

## Unit 1: Foundations of Algebra — Expressions, Equations & Inequalities (21 concepts)

| ID | Atomic Concept | Group | Generator Type | Answer Type | Visual Cat | DOK | Cognitive | Complexity | Context |
|----|---------------|-------|----------------|-------------|------------|-----|-----------|------------|---------|
| Alg1.FND.1.1 | Understanding Variables and Algebraic Expressions | B | — | MC | — | 1 | conceptual | low | abstract |
| Alg1.FND.1.2 | Evaluating Algebraic Expressions | A | eval_algebraic_alg1 | integer/decimal | — | 1 | procedural | low | abstract |
| Alg1.FND.1.3 | Simplifying Expressions (Combine Like Terms + Distributive) | A | simplify_expression_alg1 | text | — | 2 | procedural | medium | abstract |
| Alg1.FND.1.4 | Using Properties of Real Numbers | B | — | MC | — | 1 | conceptual | low | abstract |
| Alg1.FND.1.5 | Translating Words to Algebraic Expressions | HYBRID | translate_verbal_to_expr | text | — | 2 | conceptual | medium | real_world |
| Alg1.FND.2.1 | Understanding Equations and Solutions | B | — | MC | — | 1 | conceptual | low | abstract |
| Alg1.FND.2.2 | Solving One-Step Equations (Add/Subtract) | A | solve_one_step_add_sub_alg1 | decimal/fraction | — | 1 | procedural | low | abstract |
| Alg1.FND.2.3 | Solving One-Step Equations (Multiply/Divide) | A | solve_one_step_mul_div_alg1 | decimal/fraction | — | 1 | procedural | low | abstract |
| Alg1.FND.2.4 | Solving Two-Step Linear Equations | A | solve_two_step_alg1 | decimal/fraction | — | 2 | procedural | medium | abstract |
| Alg1.FND.2.5 | Solving Multi-Step Linear Equations (Distribute & Combine) | A | solve_multistep_alg1 | decimal/fraction | — | 2 | procedural | medium | abstract |
| Alg1.FND.2.6 | Solving Linear Equations with Variables Both Sides | A | solve_vars_both_sides_alg1 | decimal/fraction | — | 2 | procedural | medium | abstract |
| Alg1.FND.2.7 | Identifying No Solution / Infinitely Many Solutions | HYBRID | identify_solution_type_alg1 | MC | — | 2 | conceptual | medium | abstract |
| Alg1.FND.3.1 | Solving Absolute Value Equations | A | solve_abs_value_equation | decimal/fraction | C | 2 | procedural | high | abstract |
| Alg1.FND.4.1 | Rewriting Literal Equations (Solve for a Variable) | A | rewrite_literal_equation | text | — | 2–3 | procedural | high | real_world |
| Alg1.FND.5.1 | Understanding/Graphing Linear Inequalities (One Variable) | HYBRID | graph_inequality_1var | MC | C | 1–2 | conceptual | low | abstract |
| Alg1.FND.5.2 | Solving One-Step Inequalities (Add/Subtract) | A | solve_inequality_add_sub | MC/text | C | 1 | procedural | low | abstract |
| Alg1.FND.5.3 | Solving One-Step Inequalities (Multiply/Divide by Negative) | HYBRID | solve_inequality_neg_mul_div | MC/text | C | 2 | conceptual | medium | abstract |
| Alg1.FND.5.4 | Solving Multi-Step Linear Inequalities | A | solve_multistep_inequality_alg1 | MC/text | C | 2 | procedural | medium | abstract |
| Alg1.FND.5.5 | Solving Compound Inequalities (AND/OR) | A | solve_compound_inequality | MC/text | C | 2 | procedural | high | abstract |
| Alg1.FND.5.6 | Solving Absolute Value Inequalities | A | solve_abs_value_inequality | MC/text | C | 3 | procedural | high | abstract |
| Alg1.FND.6.1 | Creating Linear Equations/Inequalities from Context | HYBRID | create_linear_eq_from_context | text | — | 2–3 | application | high | real_world |

---

## Unit 2: Functions & Linear Functions (18 concepts)

| ID | Atomic Concept | Group | Generator Type | Answer Type | Visual Cat | DOK | Cognitive | Complexity | Context |
|----|---------------|-------|----------------|-------------|------------|-----|-----------|------------|---------|
| Alg1.FLF.1.1 | Understanding Relations and Functions | B | — | MC | B | 1 | conceptual | low | abstract |
| Alg1.FLF.1.2 | Identifying Functions (VLT and Tables) | HYBRID | identify_function_alg1 | MC | B | 2 | conceptual | medium | abstract |
| Alg1.FLF.1.3 | Function Notation and Evaluating Functions | A | eval_function_notation_alg1 | integer/decimal | — | 1 | procedural | low | abstract |
| Alg1.FLF.2.1 | Understanding Slope as Rate of Change | HYBRID | calculate_slope_alg1 | decimal/fraction | B | 2 | procedural | medium | real_world |
| Alg1.FLF.2.2 | Graphing from Slope-Intercept Form (y=mx+b) | HYBRID | — | MC | B | 2 | procedural | medium | abstract |
| Alg1.FLF.2.3 | Graphing from Standard Form (Ax+By=C) | HYBRID | — | MC | B | 2 | procedural | medium | abstract |
| Alg1.FLF.2.4 | Horizontal and Vertical Lines | HYBRID | identify_horiz_vert_line | MC | B | 1 | conceptual | low | abstract |
| Alg1.FLF.3.1 | Writing Linear Equations — Slope-Intercept Form | A | write_linear_slope_intercept | text | B | 2 | procedural | medium | abstract |
| Alg1.FLF.3.2 | Writing Linear Equations — Two Points | A | write_linear_two_points | text | B | 2 | procedural | medium | abstract |
| Alg1.FLF.3.3 | Writing Linear Equations — Point-Slope Form | A | write_linear_point_slope | text | — | 2 | procedural | medium | abstract |
| Alg1.FLF.3.4 | Converting Between Linear Equation Forms | A | convert_linear_forms | text | — | 2 | procedural | medium | abstract |
| Alg1.FLF.4.1 | Slopes of Parallel Lines | B | — | MC | B | 2 | conceptual | medium | abstract |
| Alg1.FLF.4.2 | Slopes of Perpendicular Lines | HYBRID | find_perpendicular_slope | decimal/fraction | B | 2 | conceptual | medium | abstract |
| Alg1.FLF.4.3 | Writing Equations of Parallel/Perpendicular Lines | A | write_parallel_perp_line | text | B | 2–3 | procedural | high | abstract |
| Alg1.FLF.5.1 | Graphing Linear Inequalities in Two Variables | HYBRID | — | MC | B | 2 | procedural | high | abstract |
| Alg1.FLF.6.1 | Interpreting Key Features of Linear Functions in Context | B | — | MC | B | 2–3 | reasoning | high | real_world |
| Alg1.FLF.6.2 | Constructing Linear Functions from Context | HYBRID | construct_linear_from_context | text | B | 2–3 | application | high | real_world |
| Alg1.FLF.7.1 | Comparing Properties of Two Linear Functions | B | — | MC | B | 2–3 | reasoning | high | real_world |

---

## Unit 3: Systems of Linear Equations and Inequalities (12 concepts)

| ID | Atomic Concept | Group | Generator Type | Answer Type | Visual Cat | DOK | Cognitive | Complexity | Context |
|----|---------------|-------|----------------|-------------|------------|-----|-----------|------------|---------|
| Alg1.SYS.1.1 | Understanding Systems and Solutions | B | — | MC | B | 1 | conceptual | low | abstract |
| Alg1.SYS.1.2 | Solving Systems by Graphing | HYBRID | — | MC | B | 2 | procedural | high | abstract |
| Alg1.SYS.2.1 | Solving Systems by Substitution | A | solve_system_substitution_alg1 | ordered_pair | — | 2 | procedural | high | abstract |
| Alg1.SYS.2.2 | Solving Systems by Elimination (Add/Subtract) | A | solve_system_elimination_direct | ordered_pair | — | 2 | procedural | high | abstract |
| Alg1.SYS.2.3 | Solving Systems by Elimination (Multiply First) | A | solve_system_elimination_mult | ordered_pair | — | 3 | procedural | high | abstract |
| Alg1.SYS.3.1 | Identifying Types of Solutions to Systems | HYBRID | identify_system_solution_type | MC | B | 2 | conceptual | medium | abstract |
| Alg1.SYS.4.1 | Creating Systems from Word Problems | HYBRID | create_system_from_context | text | — | 2–3 | application | high | real_world |
| Alg1.SYS.4.2 | Solving Real-World Systems | A | solve_system_word_problem | ordered_pair | — | 3 | application | high | real_world |
| Alg1.SYS.5.1 | Understanding Systems of Inequalities | B | — | MC | B | 2 | conceptual | medium | abstract |
| Alg1.SYS.5.2 | Solving Systems of Inequalities by Graphing | HYBRID | — | MC | B | 3 | procedural | high | abstract |
| Alg1.SYS.6.1 | Creating Systems of Inequalities from Context | HYBRID | create_system_inequalities | text | — | 3 | application | high | real_world |
| Alg1.SYS.6.2 | Solving Real-World Systems of Inequalities | B | — | MC | B | 3 | reasoning | high | real_world |

---

## Unit 4: Exponents & Exponential Functions (13 concepts)

| ID | Atomic Concept | Group | Generator Type | Answer Type | Visual Cat | DOK | Cognitive | Complexity | Context |
|----|---------------|-------|----------------|-------------|------------|-----|-----------|------------|---------|
| Alg1.EXP.1.1 | Review: Integer Exponents with Variables | A | eval_integer_exponents_alg1 | integer/text | — | 1 | procedural | low | abstract |
| Alg1.EXP.1.2 | Product/Quotient of Powers (Variable Bases) | A | exp_product_quotient_alg1 | text | — | 2 | procedural | medium | abstract |
| Alg1.EXP.1.3 | Power of a Power / Power of a Product/Quotient | A | exp_power_rules_alg1 | text | — | 2 | procedural | medium | abstract |
| Alg1.EXP.1.4 | Zero and Negative Exponents (Variable Expressions) | A | exp_zero_negative_alg1 | text/fraction | — | 2 | procedural | medium | abstract |
| Alg1.EXP.1.5 | Simplifying with All Exponent Laws (Multi-Variable) | A | simplify_all_exp_laws_alg1 | text | — | 2–3 | procedural | high | abstract |
| Alg1.EXP.2.1 | Understanding Exponential Functions (Definition/Characteristics) | B | — | MC | B | 2 | conceptual | medium | abstract |
| Alg1.EXP.2.2 | Graphing Exponential Functions (y = a·bˣ) | HYBRID | — | MC | B | 2 | procedural | high | abstract |
| Alg1.EXP.2.3 | Identifying Exponential Growth vs. Decay | HYBRID | identify_growth_decay | MC | B | 2 | conceptual | medium | abstract |
| Alg1.EXP.3.1 | Writing Exponential Functions from Tables/Graphs | A | write_exp_function_table | text | B | 2 | procedural | high | abstract |
| Alg1.EXP.3.2 | Writing Exponential Functions from Verbal Descriptions | HYBRID | write_exp_function_context | text | — | 2–3 | application | high | real_world |
| Alg1.EXP.4.1 | Solving Real-World Exponential Growth/Decay Problems | A | exponential_word_problem | decimal | — | 3 | application | high | real_world |
| Alg1.EXP.5.1 | Comparing Linear vs. Exponential (Tables/Graphs) | B | — | MC | B | 2 | reasoning | medium | real_world |
| Alg1.EXP.5.2 | Comparing Linear vs. Exponential (Equations/Context) | B | — | MC | — | 2–3 | reasoning | high | real_world |

---

## Unit 5: Polynomials & Factoring (11 concepts)

| ID | Atomic Concept | Group | Generator Type | Answer Type | Visual Cat | DOK | Cognitive | Complexity | Context |
|----|---------------|-------|----------------|-------------|------------|-----|-----------|------------|---------|
| Alg1.POLY.1.1 | Understanding Polynomials (Terms, Degree, Standard Form) | B | — | MC | — | 1 | conceptual | low | abstract |
| Alg1.POLY.2.1 | Adding Polynomials | A | add_polynomials | text | — | 1 | procedural | low | abstract |
| Alg1.POLY.2.2 | Subtracting Polynomials | A | subtract_polynomials | text | — | 2 | procedural | medium | abstract |
| Alg1.POLY.2.3 | Multiplying Monomial × Polynomial | A | multiply_mono_poly | text | — | 2 | procedural | medium | abstract |
| Alg1.POLY.2.4 | Multiplying Binomial × Binomial (FOIL/Box) | A | multiply_binomials_foil | text | — | 2 | procedural | medium | abstract |
| Alg1.POLY.3.1 | Factoring GCF from Polynomials | A | factor_gcf_polynomial | text | — | 2 | procedural | medium | abstract |
| Alg1.POLY.4.1 | Factoring x² + bx + c | A | factor_trinomial_a1 | text | — | 2 | procedural | medium | abstract |
| Alg1.POLY.4.2 | Factoring ax² + bx + c (a ≠ 1) | A | factor_trinomial_a_not1 | text | — | 3 | procedural | high | abstract |
| Alg1.POLY.5.1 | Factoring Difference of Two Squares | A | factor_diff_squares | text | — | 2 | procedural | medium | abstract |
| Alg1.POLY.5.2 | Factoring Perfect Square Trinomials | A | factor_perfect_square_trinomial | text | — | 2 | procedural | medium | abstract |
| Alg1.POLY.6.1 | Choosing the Best Factoring Method | HYBRID | choose_factoring_method | MC/text | — | 3 | reasoning | high | abstract |

---

## Unit 6: Quadratic Functions & Equations (10 concepts)

| ID | Atomic Concept | Group | Generator Type | Answer Type | Visual Cat | DOK | Cognitive | Complexity | Context |
|----|---------------|-------|----------------|-------------|------------|-----|-----------|------------|---------|
| Alg1.QUAD.1.1 | Understanding Quadratic Functions (Definition, Standard Form) | B | — | MC | — | 1 | conceptual | low | abstract |
| Alg1.QUAD.1.2 | Graphing Quadratic Functions and Identifying Key Features | HYBRID | — | MC | B | 2 | procedural | high | abstract |
| Alg1.QUAD.1.3 | Interpreting Key Features of Quadratics in Context | B | — | MC | B | 2–3 | reasoning | high | real_world |
| Alg1.QUAD.2.1 | Relationship Between Zeros, Roots, and X-Intercepts | B | — | MC | B | 2 | conceptual | medium | abstract |
| Alg1.QUAD.2.2 | Solving Quadratic Equations by Factoring | A | solve_quad_by_factoring | decimal/fraction | — | 2 | procedural | high | abstract |
| Alg1.QUAD.2.3 | Solving Quadratic Equations by Square Roots | A | solve_quad_by_sqrt | decimal | — | 2 | procedural | medium | abstract |
| Alg1.QUAD.2.4 | Solving Quadratic Equations — Quadratic Formula (Real Solutions) | A | solve_quadratic_formula | decimal | — | 2–3 | procedural | high | abstract |
| Alg1.QUAD.3.1 | Creating Quadratic Equations from Graphs/Tables/Context | HYBRID | create_quad_from_data | text | B | 3 | application | high | real_world |
| Alg1.QUAD.4.1 | Comparing Linear, Exponential, and Quadratic (Tables/Graphs) | HYBRID | compare_function_types_table | MC | B | 2–3 | reasoning | high | abstract |
| Alg1.QUAD.4.2 | Comparing Linear, Exponential, and Quadratic (Equations/Context) | B | — | MC | — | 2–3 | reasoning | high | real_world |

---

## Unit 7: Data Analysis & Statistics (14 concepts)

| ID | Atomic Concept | Group | Generator Type | Answer Type | Visual Cat | DOK | Cognitive | Complexity | Context |
|----|---------------|-------|----------------|-------------|------------|-----|-----------|------------|---------|
| Alg1.DAS.1.1 | Types of Data (Quantitative vs. Categorical) | B | — | MC | — | 1 | conceptual | low | real_world |
| Alg1.DAS.1.2 | Representing One-Variable Data (Dot Plots/Histograms) | B | — | MC | D | 2 | conceptual | medium | real_world |
| Alg1.DAS.1.3 | Representing One-Variable Data (Box Plots) | HYBRID | read_box_plot_alg1 | decimal | D | 2 | procedural | medium | real_world |
| Alg1.DAS.2.1 | Measures of Central Tendency (Mean, Median, Mode) | A | compute_center_alg1 | decimal | — | 1–2 | procedural | medium | abstract |
| Alg1.DAS.2.2 | Measures of Variability (Range and IQR) | A | compute_variability_alg1 | decimal | D | 2 | procedural | medium | abstract |
| Alg1.DAS.2.3 | Standard Deviation (Introduction) | B | — | MC | — | 2 | conceptual | medium | abstract |
| Alg1.DAS.2.4 | Comparing Data Sets | HYBRID | compare_datasets_alg1 | MC | D | 2–3 | reasoning | high | real_world |
| Alg1.DAS.3.1 | Representing Two-Variable Data with Scatter Plots | B | — | MC | B | 2 | conceptual | medium | real_world |
| Alg1.DAS.3.2 | Interpreting Scatter Plots (Correlation, Outliers) | B | — | MC | B | 2 | reasoning | medium | real_world |
| Alg1.DAS.4.1 | Line of Best Fit (Linear Regression) | HYBRID | line_of_best_fit_alg1 | decimal | B | 2–3 | procedural | high | real_world |
| Alg1.DAS.4.2 | Using Line of Best Fit for Prediction/Interpretation | HYBRID | predict_from_regression | decimal | B | 2–3 | application | high | real_world |
| Alg1.DAS.4.3 | Understanding Residuals | A | compute_residual | decimal | B | 2 | procedural | high | abstract |
| Alg1.DAS.5.1 | Correlation Coefficient (r-value Introduction) | B | — | MC | B | 2 | conceptual | medium | real_world |
| Alg1.DAS.5.2 | Correlation vs. Causation | B | — | MC | — | 2–3 | reasoning | high | real_world |

---

## Visual Generator Flags (24 concepts)

| Category | Concepts | SVG Type |
|----------|---------|----------|
| C (number line) | FND.3.1, FND.5.1–5.6 | Absolute value / inequality number lines |
| B (coordinate plane) | FLF.1.2, FLF.2.1–2.4, FLF.3.1–3.2, FLF.4.2–4.3, FLF.5.1, FLF.6.1–6.2, FLF.7.1 | Linear function graphs |
| B (coordinate plane) | SYS.1.2, SYS.3.1, SYS.5.2 | Systems / feasible region |
| B (function graph) | EXP.2.2–2.3, EXP.3.1, EXP.5.1 | Exponential growth/decay curves |
| B (parabola graph) | QUAD.1.2–1.3, QUAD.2.1, QUAD.3.1, QUAD.4.1 | Parabolas with labeled vertex/intercepts |
| D (data display) | DAS.1.2–1.3, DAS.2.2–2.4 | Box plots, histograms |
| B (scatter plot) | DAS.3.1–3.2, DAS.4.1–4.2, DAS.5.1 | Scatter plots with/without regression line |

---

## Division & Heat Profiles

- **Division:** Varsity (CCSS Algebra 1 lane)
- **Practice Heat:** DOK 1–2, procedural, abstract context — equation solving, expression simplification, factoring
- **Standard Heat:** DOK 2, mixed — function writing, system solving, polynomial operations
- **Championship Heat:** DOK 2–3, reasoning/application — interpreting context, comparing function types, regression interpretation

---

## Pool Isolation Rule
`algebra_1` — NO shared generator IDs with `nc_math_1`, `math_fundamentals`, or any grade-level pool.  
EXP.1.x has conceptual overlap with MF.ER.1.x but uses **algebraic (multi-variable) expressions** exclusively, where MF.ER used numeric bases. Param escalation enforces the distinction.
