# Generator Quality Audit — G8
**Date:** 2026-06-07 21:21 | **Evaluator:** DEEPSEEK | **Mode:** STRICT zero-tolerance

## Summary

| Metric | Value |
|---|---|
| Generators tested | 25 |
| Total evaluations | 1000 |
| Overall accuracy | 98.5% |
| True wrong answers | 14 |
| Format-only diffs | 2 |
| Wording issues | 2 |
| ✅ Pilot-ready | 20 / 25 |
| ❌ Blocked | 5 |

## ✅ Pilot-Ready Generators (20)

- `g8_eval_roots`
- `g8_solve_square_eq`
- `g8_solve_cube_eq`
- `g8_compare_irrationals`
- `g8_simplify_exponents`
- `g8_solve_linear_multistep`
- `g8_solve_vars_both_sides`
- `g8_evaluate_function_notation`
- `g8_classify_equation_type`
- `g8_construct_linear_function`
- `g8_coordinate_dilation`
- `g8_similar_figures_solve`
- `g8_triangle_angle_sum`
- `g8_pythagorean_missing_side`
- `g8_pythagorean_2d_context`
- `g8_pythagorean_converse`
- `g8_coordinate_distance`
- `g8_volume_cone`
- `g8_relative_frequency_table`
- `g8_pythagorean_3d_context`


## ❌ Blocked — Fix Before Pilot (5)

### `g8_solve_system_substitution` — 38/40 correct (2% wrong)
- ❌ WRONG d1: Q='Solve the system by substitution:
y = -2x + 8
y = -4x + 6

Enter ' | Gen='(-1, 10)' | Should='(1, 6)' | Conf=high

**🔧 Auto-fix suggestion:**
- **Diagnosis:** The solution steps incorrectly compute the x-coordinate by subtracting the intercepts in the wrong order, leading to an incorrect x value. The correct equation should be m*x + b = n*x + c, so combining x-terms gives (m - n)*x = c - b, but the code uses yIntercept2 - yIntercept1 instead of yIntercept2 - yIntercept1? Actually the error is that the steps compute x = (yIntercept2 - yIntercept1) / (m - n) but the generated x is from randomInt, which may not satisfy that equation. The root cause is that the code generates x randomly and then back-solves for yIntercept2, but the solution steps then derive x from the intercepts, which may not match the random x because the steps use the wrong arithmetic. The fix is to ensure the solution steps correctly compute x from the intercepts and slopes, or to generate x from the equation.
- **Lines to change:**
  - Line where x is generated: change to compute x from the equation (yIntercept2 - yIntercept1) / (m - n) instead of randomInt
  - Line where yIntercept2 is computed: ensure it is consistent with the new x
- **Proposed fix:**
```typescript
export function generate_g8_solve_system_substitution(difficulty: DifficultyLevel): GeneratedQuestion {
  let m: number, n: number;
  do {
    m = randomNonZeroInt(-4, 4);
    n = randomNonZeroInt(-4, 4);
  } while (n === m);
  const yIntercept1 = randomInt(-8, 8);
  // Compute x from the equation: m*x + yIntercept1 = n*x + yIntercept2 => (m-n)*x = yIntercept2 - yIntercept1
  // Choose yIntercept2 such that x is an integer
  let x: number, yIntercept2: number;
  do {
    yIntercept2 = randomInt(
```

### `g8_solve_system_elimination` — 39/40 correct (2% wrong)
- ❌ WRONG d4: Q='Solve the system by elimination:
x + 2y = -4
-x - 3y = 8

Enter t' | Gen='(4, -4)' | Should='(4, -4)' | Conf=high

**🔧 Auto-fix suggestion:**
- **Diagnosis:** The eq function incorrectly handles the sign of the y term when b is negative, producing malformed equations like '-x - -3y = 8' instead of '-x + 3y = 8'.
- **Lines to change:**
  - Fix the eq function to correctly format the y term sign and coefficient.
- **Proposed fix:**
```typescript
const eq = (a: number, b: number, c: number): string => {
  const aPart = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
  const bAbs = Math.abs(b);
  const bPart = bAbs === 1 ? 'y' : `${bAbs}y`;
  const sign = b >= 0 ? '+' : '-';
  return `${aPart} ${sign} ${bPart} = ${c}`;
};
```

### `g8_volume_cylinder` — 31/40 correct (22% wrong)
- ❌ WRONG d1: Q='Find the volume of a cylinder with radius 7 cm and height 12 cm. ' | Gen='1847.25' | Should='1847.26' | Conf=high
- ❌ WRONG d1: Q='Find the volume of a cylinder with radius 8 cm and height 8 cm. U' | Gen='1608.49' | Should='1608.50' | Conf=high
- ❌ WRONG d2: Q='Find the volume of a cylinder with radius 12 cm and height 7 cm. ' | Gen='3166.72' | Should='3166.73' | Conf=high
- ❌ WRONG d2: Q='Find the volume of a cylinder with radius 12 cm and height 5 cm. ' | Gen='2261.94' | Should='2261.95' | Conf=high
- ❌ WRONG d2: Q='Find the volume of a cylinder with radius 8 cm and height 8 cm. U' | Gen='1608.49' | Should='1608.50' | Conf=high
- ❌ WRONG d2: Q='Find the volume of a cylinder with radius 7 cm and height 12 cm. ' | Gen='1847.25' | Should='1847.26' | Conf=high

**🔧 Auto-fix suggestion:**
- **Diagnosis:** The volume calculation uses toFixed(2) which truncates the number, but the expected rounding is to the nearest hundredth. The error occurs because toFixed rounds half away from zero, but the intermediate multiplication may produce a value that is slightly less than the true value due to floating-point precision, leading to incorrect rounding in some cases.
- **Lines to change:**
  - Line: const V = +(PI * r * r * h).toFixed(2);
  - Replace with: const V = Math.round(PI * r * r * h * 100) / 100;
- **Proposed fix:**
```typescript
export function generate_g8_volume_cylinder(difficulty: DifficultyLevel): GeneratedQuestion {
  const PI = 3.14159;
  const r = randomInt(2, difficulty === 1 ? 8 : 12);
  const h = randomInt(3, difficulty === 1 ? 12 : 20);
  const V = Math.round(PI * r * r * h * 100) / 100;
  return g7Wrap(difficulty, 'g8_volume_cylinder', 'M8.GEO.PV.3.2', 'Volume of a Cylinder', {
    question: `Find the volume of a cylinder with radius ${r} cm and height ${h} cm. Use π ≈ 3.14159 and round to 2 decimal places.`
```

### `g8_volume_sphere` — 38/40 correct (5% wrong)
- ❌ WRONG d1: Q='Find the volume of a sphere with radius 7 cm. Use π ≈ 3.14159 and' | Gen='1436.75' | Should='1436.76' | Conf=high
- ❌ WRONG d4: Q='Find the volume of a sphere with radius 7 cm. Use π ≈ 3.14159 and' | Gen='1436.75' | Should='1436.76' | Conf=high

**🔧 Auto-fix suggestion:**
- **Diagnosis:** The volume calculation uses a truncated value of π (3.14159) and rounds the intermediate result, causing a rounding error that leads to an incorrect final answer (e.g., 1436.75 instead of 1436.76 for r=7).
- **Lines to change:**
  - Line 4: Change the calculation of V to use a more precise π value and round only at the end.
  - Line 4: Replace `const V = +((4 / 3) * PI * r * r * r).toFixed(2);` with `const V = Math.round((4 / 3) * Math.PI * r * r * r * 100) / 100;`
- **Proposed fix:**
```typescript
export function generate_g8_volume_sphere(difficulty: DifficultyLevel): GeneratedQuestion {
  const r = randomInt(2, difficulty === 1 ? 7 : 10);
  const V = Math.round((4 / 3) * Math.PI * r * r * r * 100) / 100;
  return g7Wrap(difficulty, 'g8_volume_sphere', 'M8.GEO.PV.3.6', 'Volume of a Sphere', {
    question: `Find the volume of a sphere with radius ${r} cm. Use π ≈ 3.14159 and round to 2 decimal places.`,
    answer: V.toFixed(2),
    solution_steps: [
      `V = (4/3) × π × r³`,
      `V =
```

### `g8_volume_3d_word_problem` — 39/40 correct (2% wrong)
- ❌ WRONG d2: Q='A water tank is shaped like a cylinder with radius 3 m and height' | Gen='424.11' | Should='424.12' | Conf=high

**🔧 Auto-fix suggestion:**
- **Diagnosis:** The volume calculation uses PI = 3.14159, but the rounding to 2 decimal places after multiplication introduces floating-point errors that cause the result to be slightly off (e.g., 424.114... rounds to 424.11 instead of 424.12).
- **Lines to change:**
  - Line: const V = +(PI * r * r * h).toFixed(2); — change to use Math.round with a small epsilon to avoid floating-point rounding errors.
  - Line: const V = +(PI * r * r * h / 3).toFixed(2); — same fix.
  - Line: const V = +((4 / 3) * PI * r * r * r).toFixed(2); — same fix.
- **Proposed fix:**
```typescript
export function generate_g8_volume_3d_word_problem(difficulty: DifficultyLevel): GeneratedQuestion {
  const PI = 3.14159;
  const shape = (['cylinder', 'cone', 'sphere'] as const)[randomInt(0, 2)]!;
  if (shape === 'cylinder') {
    const r = randomInt(2, 6);
    const h = randomInt(5, 15);
    const V = Math.round((PI * r * r * h + 1e-9) * 100) / 100;
    return g7Wrap(difficulty, 'g8_volume_3d_word_problem', 'M8.GEO.PV.4.1', '3D Volume — Real-World', {
      question: `A water tank is shaped 
```


## ⚠️ Format Differences (math correct, format varies)

### `g8_volume_sphere`
- FORMAT d2: Gen='1436.75' Expected='1436.76' (The answer should be rounded to 2 decimal places; 1436.75 is incorrect rounding (should be 1436.76).)
- FORMAT d2: Gen='1436.75' Expected='1436.76' (The answer should be rounded to 2 decimal places; 1436.75 is incorrect rounding (should be 1436.76).)


## ⚠️ Wording Issues

### `g8_pythagorean_2d_context`
- WORDING d1: The question incorrectly states that the bases form a square but then gives inconsistent leg lengths (80 and 150 feet) for a right triangle, which contradicts the geometry of a baseball diamond. The generator should have used the same distance for both legs. | Q='On a baseball diamond, the bases form a square. From home plate t'
- WORDING d1: The question incorrectly states that the bases form a square but then gives inconsistent leg lengths (80 and 150 feet) for a right triangle, which contradicts the square property. In a real baseball diamond, the distance from home to first and first to second are equal (90 feet). The problem should clarify that it is a hypothetical scenario or correct the numbers. | Q='On a baseball diamond, the bases form a square. From home plate t'


## Full Results

| Generator | Accuracy | Wrong% | Format Diffs | Pilot Ready |
|---|---|---|---|---|
| `g8_eval_roots` | 40/40 | 0% | 0 | ✅ |
| `g8_solve_square_eq` | 40/40 | 0% | 0 | ✅ |
| `g8_solve_cube_eq` | 40/40 | 0% | 0 | ✅ |
| `g8_compare_irrationals` | 40/40 | 0% | 0 | ✅ |
| `g8_simplify_exponents` | 40/40 | 0% | 0 | ✅ |
| `g8_solve_linear_multistep` | 40/40 | 0% | 0 | ✅ |
| `g8_solve_vars_both_sides` | 40/40 | 0% | 0 | ✅ |
| `g8_evaluate_function_notation` | 40/40 | 0% | 0 | ✅ |
| `g8_classify_equation_type` | 40/40 | 0% | 0 | ✅ |
| `g8_solve_system_substitution` | 38/40 | 2% | 0 | ❌ |
| `g8_solve_system_elimination` | 39/40 | 2% | 0 | ❌ |
| `g8_construct_linear_function` | 40/40 | 0% | 0 | ✅ |
| `g8_coordinate_dilation` | 40/40 | 0% | 0 | ✅ |
| `g8_similar_figures_solve` | 40/40 | 0% | 0 | ✅ |
| `g8_triangle_angle_sum` | 40/40 | 0% | 0 | ✅ |
| `g8_pythagorean_missing_side` | 40/40 | 0% | 0 | ✅ |
| `g8_pythagorean_2d_context` | 40/40 | 0% | 0 | ✅ |
| `g8_pythagorean_converse` | 40/40 | 0% | 0 | ✅ |
| `g8_coordinate_distance` | 40/40 | 0% | 0 | ✅ |
| `g8_volume_cylinder` | 31/40 | 22% | 0 | ❌ |
| `g8_volume_cone` | 40/40 | 0% | 0 | ✅ |
| `g8_volume_sphere` | 38/40 | 5% | 2 | ❌ |
| `g8_volume_3d_word_problem` | 39/40 | 2% | 0 | ❌ |
| `g8_relative_frequency_table` | 40/40 | 0% | 0 | ✅ |
| `g8_pythagorean_3d_context` | 40/40 | 0% | 0 | ✅ |