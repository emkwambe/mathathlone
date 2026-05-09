// =============================================================================
// MathAthlone Answer Validation System
// =============================================================================
// Validates student answers against correct answers with type-specific logic
// Supports: integers, decimals, fractions, ordered pairs, expressions, etc.
// =============================================================================

import type { AnswerType } from './mathathlone-generators';

export interface ValidationResult {
  is_correct: boolean;
  normalized_submitted: string;
  normalized_correct: string;
  feedback?: string;
}

// -----------------------------------------------------------------------------
// UTILITY FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Remove whitespace and normalize case
 */
function normalize(str: string): string {
  return str.replace(/\s+/g, '').toLowerCase();
}

/**
 * Parse a fraction string "a/b" into [numerator, denominator]
 */
function parseFraction(str: string): [number, number] | null {
  const match = str.match(/^(-?\d+)\/(-?\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const den = parseInt(match[2], 10);
  if (den === 0) return null;
  return [num, den];
}

/**
 * GCD for fraction simplification
 */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Simplify a fraction to lowest terms
 */
function simplifyFraction(num: number, den: number): [number, number] {
  if (den === 0) return [num, den];
  const divisor = gcd(num, den);
  let sNum = num / divisor;
  let sDen = den / divisor;
  // Ensure denominator is positive
  if (sDen < 0) {
    sNum = -sNum;
    sDen = -sDen;
  }
  return [sNum, sDen];
}

/**
 * Parse an ordered pair "(x, y)" into [x, y]
 */
function parseOrderedPair(str: string): [number, number] | null {
  const cleaned = str.replace(/\s+/g, '');
  const match = cleaned.match(/^\((-?[\d.]+),(-?[\d.]+)\)$/);
  if (!match) return null;
  const x = parseFloat(match[1]);
  const y = parseFloat(match[2]);
  if (isNaN(x) || isNaN(y)) return null;
  return [x, y];
}

/**
 * Parse an integer pair "{a, b}" into sorted [a, b]
 */
function parseIntegerPair(str: string): [number, number] | null {
  const cleaned = str.replace(/\s+/g, '');
  // Accept {a, b} or {a,b} or a, b
  const match = cleaned.match(/^\{?(-?[\d.]+),(-?[\d.]+)\}?$/);
  if (!match) return null;
  const a = parseFloat(match[1]);
  const b = parseFloat(match[2]);
  if (isNaN(a) || isNaN(b)) return null;
  return [Math.min(a, b), Math.max(a, b)];
}

/**
 * Parse an interval "(-3, 5]" or "[-3, 5)" etc.
 */
function parseInterval(str: string): { left: number; right: number; leftOpen: boolean; rightOpen: boolean } | null {
  const cleaned = str.replace(/\s+/g, '');
  const match = cleaned.match(/^([\[\(])(-?[\d.]+),(-?[\d.]+)([\]\)])$/);
  if (!match) return null;
  return {
    leftOpen: match[1] === '(',
    left: parseFloat(match[2]),
    right: parseFloat(match[3]),
    rightOpen: match[4] === ')',
  };
}

/**
 * Normalize an algebraic expression for comparison
 * Basic normalization: remove spaces, sort terms
 */
function normalizeExpression(expr: string): string {
  // Remove all whitespace
  let normalized = expr.replace(/\s+/g, '');
  
  // Convert to lowercase
  normalized = normalized.toLowerCase();
  
  // Handle common variations
  normalized = normalized.replace(/\*\*/g, '^'); // ** to ^
  normalized = normalized.replace(/\^2/g, '²');
  normalized = normalized.replace(/\^3/g, '³');
  
  // Remove leading + sign
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }
  
  return normalized;
}

/**
 * Check if two expressions are equivalent (basic check)
 */
function expressionsEquivalent(expr1: string, expr2: string): boolean {
  const n1 = normalizeExpression(expr1);
  const n2 = normalizeExpression(expr2);
  
  // Direct match
  if (n1 === n2) return true;
  
  // Try reversing factor order for products like (x+3)(x-2) vs (x-2)(x+3)
  // This is a simplified check - production would use CAS
  const reversed1 = reverseFactors(n1);
  if (reversed1 === n2) return true;
  
  const reversed2 = reverseFactors(n2);
  if (n1 === reversed2) return true;
  
  return false;
}

/**
 * Reverse the order of factors in a product like (a)(b) -> (b)(a)
 */
function reverseFactors(expr: string): string {
  const factorMatch = expr.match(/^\(([^)]+)\)\(([^)]+)\)$/);
  if (factorMatch) {
    return `(${factorMatch[2]})(${factorMatch[1]})`;
  }
  return expr;
}

/**
 * Parse a linear equation y = mx + b into {m, b}
 */
function parseLinearEquation(eq: string): { m: number; b: number } | null {
  const cleaned = eq.replace(/\s+/g, '').toLowerCase();
  
  // Try y = mx + b format
  let match = cleaned.match(/^y=(-?[\d./]*)x([+-][\d./]+)?$/);
  if (match) {
    let m = match[1] === '' || match[1] === '+' ? 1 : 
            match[1] === '-' ? -1 : 
            parseFloat(match[1]);
    const b = match[2] ? parseFloat(match[2]) : 0;
    return { m, b };
  }
  
  // Try y = b (horizontal line)
  match = cleaned.match(/^y=(-?[\d./]+)$/);
  if (match) {
    return { m: 0, b: parseFloat(match[1]) };
  }
  
  // Try y = mx format (no b)
  match = cleaned.match(/^y=(-?[\d./]*)x$/);
  if (match) {
    let m = match[1] === '' || match[1] === '+' ? 1 : 
            match[1] === '-' ? -1 : 
            parseFloat(match[1]);
    return { m, b: 0 };
  }
  
  return null;
}

// -----------------------------------------------------------------------------
// VALIDATORS BY TYPE
// -----------------------------------------------------------------------------

/**
 * Validate integer answer
 */
function validateInteger(submitted: string, correct: string): ValidationResult {
  const subVal = parseInt(submitted.trim(), 10);
  const corVal = parseInt(correct.trim(), 10);
  
  if (isNaN(subVal)) {
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Please enter a valid integer',
    };
  }
  
  return {
    is_correct: subVal === corVal,
    normalized_submitted: String(subVal),
    normalized_correct: String(corVal),
  };
}

/**
 * Validate decimal answer with tolerance
 */
function validateDecimal(submitted: string, correct: string, tolerance = 0.01): ValidationResult {
  const subVal = parseFloat(submitted.trim());
  const corVal = parseFloat(correct.trim());
  
  if (isNaN(subVal)) {
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Please enter a valid number',
    };
  }
  
  const isCorrect = Math.abs(subVal - corVal) <= tolerance;
  
  return {
    is_correct: isCorrect,
    normalized_submitted: String(subVal),
    normalized_correct: String(corVal),
  };
}

/**
 * Validate fraction answer (must be in simplified form)
 */
function validateFraction(submitted: string, correct: string): ValidationResult {
  const subFrac = parseFraction(submitted.trim());
  const corFrac = parseFraction(correct.trim());
  
  if (!subFrac) {
    // Maybe they entered an integer?
    const intVal = parseInt(submitted.trim(), 10);
    if (!isNaN(intVal)) {
      const corSimp = corFrac ? simplifyFraction(corFrac[0], corFrac[1]) : null;
      if (corSimp && corSimp[1] === 1 && corSimp[0] === intVal) {
        return {
          is_correct: true,
          normalized_submitted: String(intVal),
          normalized_correct: correct,
        };
      }
    }
    
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Please enter a fraction in the form a/b',
    };
  }
  
  if (!corFrac) {
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Invalid correct answer format',
    };
  }
  
  // Compare as decimals (handles equivalent fractions)
  const subDecimal = subFrac[0] / subFrac[1];
  const corDecimal = corFrac[0] / corFrac[1];
  
  // Also check if submitted is simplified
  const subSimp = simplifyFraction(subFrac[0], subFrac[1]);
  const isSimplified = subSimp[0] === subFrac[0] && subSimp[1] === subFrac[1];
  
  const isCorrect = Math.abs(subDecimal - corDecimal) < 0.0001;
  
  return {
    is_correct: isCorrect,
    normalized_submitted: `${subFrac[0]}/${subFrac[1]}`,
    normalized_correct: correct,
    feedback: isCorrect && !isSimplified ? 'Correct! But remember to simplify your fractions.' : undefined,
  };
}

/**
 * Validate ordered pair (x, y)
 */
function validateOrderedPair(submitted: string, correct: string): ValidationResult {
  const subPair = parseOrderedPair(submitted.trim());
  const corPair = parseOrderedPair(correct.trim());
  
  if (!subPair) {
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Please enter an ordered pair in the form (x, y)',
    };
  }
  
  if (!corPair) {
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Invalid correct answer format',
    };
  }
  
  const isCorrect = 
    Math.abs(subPair[0] - corPair[0]) < 0.01 && 
    Math.abs(subPair[1] - corPair[1]) < 0.01;
  
  return {
    is_correct: isCorrect,
    normalized_submitted: `(${subPair[0]}, ${subPair[1]})`,
    normalized_correct: `(${corPair[0]}, ${corPair[1]})`,
  };
}

/**
 * Validate integer pair {a, b} (order doesn't matter)
 */
function validateIntegerPair(submitted: string, correct: string): ValidationResult {
  const subPair = parseIntegerPair(submitted.trim());
  const corPair = parseIntegerPair(correct.trim());
  
  if (!subPair) {
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Please enter a set of two numbers in the form {a, b}',
    };
  }
  
  if (!corPair) {
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Invalid correct answer format',
    };
  }
  
  // Order doesn't matter for sets
  const isCorrect = subPair[0] === corPair[0] && subPair[1] === corPair[1];
  
  return {
    is_correct: isCorrect,
    normalized_submitted: `{${subPair[0]}, ${subPair[1]}}`,
    normalized_correct: `{${corPair[0]}, ${corPair[1]}}`,
  };
}

/**
 * Validate algebraic expression
 */
function validateExpression(submitted: string, correct: string): ValidationResult {
  const isCorrect = expressionsEquivalent(submitted, correct);
  
  return {
    is_correct: isCorrect,
    normalized_submitted: normalizeExpression(submitted),
    normalized_correct: normalizeExpression(correct),
  };
}

/**
 * Validate linear equation (y = mx + b)
 */
function validateEquation(submitted: string, correct: string): ValidationResult {
  const subEq = parseLinearEquation(submitted.trim());
  const corEq = parseLinearEquation(correct.trim());
  
  if (!subEq) {
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Please enter an equation in the form y = mx + b',
    };
  }
  
  if (!corEq) {
    // Fallback to expression comparison
    return validateExpression(submitted, correct);
  }
  
  const isCorrect = 
    Math.abs(subEq.m - corEq.m) < 0.01 && 
    Math.abs(subEq.b - corEq.b) < 0.01;
  
  return {
    is_correct: isCorrect,
    normalized_submitted: `y = ${subEq.m}x + ${subEq.b}`,
    normalized_correct: `y = ${corEq.m}x + ${corEq.b}`,
  };
}

/**
 * Validate inequality (x > 5, x ≤ -3, etc.)
 */
function validateInequality(submitted: string, correct: string): ValidationResult {
  // Normalize inequality symbols
  const normalizeIneq = (s: string) => {
    return s.replace(/\s+/g, '')
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .toLowerCase();
  };
  
  const subNorm = normalizeIneq(submitted);
  const corNorm = normalizeIneq(correct);
  
  // Simple string comparison after normalization
  const isCorrect = subNorm === corNorm;
  
  return {
    is_correct: isCorrect,
    normalized_submitted: subNorm,
    normalized_correct: corNorm,
  };
}

/**
 * Validate interval notation
 */
function validateInterval(submitted: string, correct: string): ValidationResult {
  const subInt = parseInterval(submitted.trim());
  const corInt = parseInterval(correct.trim());
  
  if (!subInt) {
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Please enter an interval in the form (a, b), [a, b], (a, b], or [a, b)',
    };
  }
  
  if (!corInt) {
    return {
      is_correct: false,
      normalized_submitted: submitted,
      normalized_correct: correct,
      feedback: 'Invalid correct answer format',
    };
  }
  
  const isCorrect = 
    subInt.leftOpen === corInt.leftOpen &&
    subInt.rightOpen === corInt.rightOpen &&
    Math.abs(subInt.left - corInt.left) < 0.01 &&
    Math.abs(subInt.right - corInt.right) < 0.01;
  
  const formatInterval = (int: typeof subInt) => {
    const leftBracket = int.leftOpen ? '(' : '[';
    const rightBracket = int.rightOpen ? ')' : ']';
    return `${leftBracket}${int.left}, ${int.right}${rightBracket}`;
  };
  
  return {
    is_correct: isCorrect,
    normalized_submitted: formatInterval(subInt),
    normalized_correct: formatInterval(corInt),
  };
}

/**
 * Validate text answer (exact match, case-insensitive)
 */
function validateText(submitted: string, correct: string): ValidationResult {
  const subNorm = normalize(submitted);
  const corNorm = normalize(correct);
  
  // Handle common variations
  const variations: Record<string, string[]> = {
    'nosolution': ['nosolution', 'none', 'noanswer', '∅', 'emptyset', 'impossible'],
    'infinitelymanysolutions': ['infinitelymanysolutions', 'infinite', 'allrealnumbers', 'infinitelymany', 'allx'],
    'growth': ['growth', 'exponentialgrowth', 'increasing'],
    'decay': ['decay', 'exponentialdecay', 'decreasing'],
  };
  
  // Check if both match a variation group
  for (const [key, vars] of Object.entries(variations)) {
    const subMatches = vars.includes(subNorm);
    const corMatches = vars.includes(corNorm);
    if (subMatches && corMatches) {
      return {
        is_correct: true,
        normalized_submitted: key,
        normalized_correct: key,
      };
    }
  }
  
  return {
    is_correct: subNorm === corNorm,
    normalized_submitted: subNorm,
    normalized_correct: corNorm,
  };
}

// -----------------------------------------------------------------------------
// MAIN VALIDATION FUNCTION
// -----------------------------------------------------------------------------

/**
 * Validate a student's answer against the correct answer
 * @param submitted - The student's submitted answer
 * @param correct - The correct answer
 * @param answerType - The type of answer expected
 * @returns ValidationResult with is_correct, normalized values, and optional feedback
 */
export function validateAnswer(
  submitted: string,
  correct: string,
  answerType: AnswerType
): ValidationResult {
  // Handle empty submissions
  if (!submitted || submitted.trim() === '') {
    return {
      is_correct: false,
      normalized_submitted: '',
      normalized_correct: correct,
      feedback: 'Please enter an answer',
    };
  }
  
  switch (answerType) {
    case 'integer':
      return validateInteger(submitted, correct);
    case 'decimal':
      return validateDecimal(submitted, correct);
    case 'fraction':
      return validateFraction(submitted, correct);
    case 'ordered_pair':
      return validateOrderedPair(submitted, correct);
    case 'integer_pair':
      return validateIntegerPair(submitted, correct);
    case 'expression':
      return validateExpression(submitted, correct);
    case 'equation':
      return validateEquation(submitted, correct);
    case 'inequality':
      return validateInequality(submitted, correct);
    case 'interval':
      return validateInterval(submitted, correct);
    case 'text':
      return validateText(submitted, correct);
    default:
      // Fallback to text comparison
      return validateText(submitted, correct);
  }
}

// -----------------------------------------------------------------------------
// CTA SCORING
// -----------------------------------------------------------------------------

export interface CTAScoreComponents {
  content_score: number;      // 0-100: Based on correctness
  time_score: number;         // 0-100: Based on speed
  accuracy_score: number;     // 0-100: Based on attempt number
  cta_score: number;          // Final CTA score (weighted)
  points_earned: number;      // Actual points for this question
}

/**
 * Calculate CTA score for a question submission
 * CTA = (Content × 0.50) + (Time × 0.30) + (Accuracy × 0.20)
 */
export function calculateCTAScore(
  isCorrect: boolean,
  timeTakenMs: number,
  timeLimitMs: number,
  attemptNumber: number,
  basePoints: number = 100
): CTAScoreComponents {
  // Content Score: 100 if correct, 0 if wrong
  const content_score = isCorrect ? 100 : 0;
  
  // Time Score: Linear decay from 100 to 0 over the time limit
  // Faster = higher score
  let time_score = 0;
  if (isCorrect && timeTakenMs < timeLimitMs) {
    time_score = Math.max(0, 100 * (1 - timeTakenMs / timeLimitMs));
  }
  
  // Accuracy Score: Penalize multiple attempts
  // 1st attempt: 100, 2nd: 70, 3rd: 40, 4th+: 10
  const accuracy_penalties: Record<number, number> = {
    1: 100,
    2: 70,
    3: 40,
  };
  const accuracy_score = isCorrect ? (accuracy_penalties[attemptNumber] ?? 10) : 0;
  
  // Calculate weighted CTA
  const cta_score = 
    (content_score * 0.50) + 
    (time_score * 0.30) + 
    (accuracy_score * 0.20);
  
  // Points earned (scaled by CTA)
  const points_earned = isCorrect ? Math.round(basePoints * (cta_score / 100)) : 0;
  
  return {
    content_score: Math.round(content_score),
    time_score: Math.round(time_score),
    accuracy_score: Math.round(accuracy_score),
    cta_score: Math.round(cta_score * 100) / 100,  // 2 decimal places
    points_earned,
  };
}

// -----------------------------------------------------------------------------
// EXPORTS
// -----------------------------------------------------------------------------

export {
  parseFraction,
  simplifyFraction,
  parseOrderedPair,
  parseIntegerPair,
  parseInterval,
  normalizeExpression,
  parseLinearEquation,
};
