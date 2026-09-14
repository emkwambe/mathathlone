export const STATIC_OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;
export type StaticOptionKey = (typeof STATIC_OPTION_KEYS)[number];

export type StaticReviewDecision = 'approved' | 'hold' | 'revise' | 'retire';
export type DeterministicReviewResult = 'pass' | 'hold' | 'fail';

export interface StaticOption {
  key: StaticOptionKey;
  text: string;
}

export interface StaticQuestionSource {
  id: string;
  concept_id: string;
  question_type: string;
  question_text: string;
  question_latex: string | null;
  question_image_url: string | null;
  options: unknown;
  option_images: unknown;
  correct_answer: string;
  correct_answer_index: number | null;
  explanation: string | null;
  solution_steps: unknown;
  difficulty: number;
  is_active: boolean;
  is_verified: boolean | null;
}

export interface StaticQuestionReviewRecord {
  id?: string;
  static_question_id: string;
  atomic_concept_id: string;
  content_sha256: string;
  deterministic_result: DeterministicReviewResult;
  decision: StaticReviewDecision;
  reviewed_at: string;
  created_at?: string;
}

export interface StaticSourceEligibility {
  eligible: boolean;
  reasonCode:
    | 'eligible'
    | 'inactive'
    | 'unverified'
    | 'wrong_concept_mapping'
    | 'unsupported_question_type'
    | 'unsupported_image_source'
    | 'missing_prompt'
    | 'invalid_options'
    | 'invalid_correct_answer'
    | 'missing_explanation'
    | 'invalid_difficulty'
    | 'missing_review_record'
    | 'review_not_approved'
    | 'review_fingerprint_mismatch';
  contentSha256: string;
  options: StaticOption[] | null;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

/**
 * Produces a stable SHA-256 signature for every student-facing or scored static
 * source field. An approval is valid only while this signature still matches.
 */
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;

function rotateRight(value: number, shift: number): number {
  return (value >>> shift) | (value << (32 - shift));
}

/** Browser- and server-safe SHA-256 for a compact canonical review payload. */
export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x1_0000_0000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index++) words[index] = view.getUint32(offset + index * 4, false);
    for (let index = 16; index < 64; index++) {
      const s0 = rotateRight(words[index - 15]!, 7) ^ rotateRight(words[index - 15]!, 18) ^ (words[index - 15]! >>> 3);
      const s1 = rotateRight(words[index - 2]!, 17) ^ rotateRight(words[index - 2]!, 19) ^ (words[index - 2]! >>> 10);
      words[index] = (words[index - 16]! + s0 + words[index - 7]! + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    for (let index = 0; index < 64; index++) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choose = (e & f) ^ (~e & g);
      const temp1 = (h + sum1 + choose + SHA256_K[index]! + words[index]!) >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sum0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7].map((word) => word.toString(16).padStart(8, '0')).join('');
}

export function staticQuestionContentSha256(source: StaticQuestionSource): string {
  const canonicalPayload = canonicalize({
    question_type: source.question_type,
    question_text: source.question_text,
    question_latex: source.question_latex,
    question_image_url: source.question_image_url,
    options: source.options,
    option_images: source.option_images,
    correct_answer: source.correct_answer,
    correct_answer_index: source.correct_answer_index,
    explanation: source.explanation,
    solution_steps: source.solution_steps,
    difficulty: source.difficulty,
  });
  return sha256Hex(JSON.stringify(canonicalPayload));
}

export function normalizeStaticOptions(value: unknown): StaticOption[] | null {
  if (!Array.isArray(value) || value.length !== STATIC_OPTION_KEYS.length) return null;

  const options = value.map((item, index) => {
    if (typeof item === 'string') {
      const text = item.trim();
      return text ? { key: STATIC_OPTION_KEYS[index]!, text } : null;
    }
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    const key = typeof record.key === 'string' ? record.key.trim() : '';
    const text = typeof record.text === 'string' ? record.text.trim() : '';
    if (!STATIC_OPTION_KEYS.includes(key as StaticOptionKey) || !text) return null;
    return { key: key as StaticOptionKey, text };
  });

  if (options.some((option) => option === null)) return null;
  const normalized = options as StaticOption[];
  const keySet = new Set(normalized.map((option) => option.key));
  const textSet = new Set(normalized.map((option) => option.text.toLocaleLowerCase()));
  if (keySet.size !== STATIC_OPTION_KEYS.length || textSet.size !== STATIC_OPTION_KEYS.length) return null;

  return STATIC_OPTION_KEYS.map((key) => normalized.find((option) => option.key === key)!);
}

function latestApplicableReview(
  reviews: readonly StaticQuestionReviewRecord[],
  staticQuestionId: string,
  atomicConceptId: string,
): StaticQuestionReviewRecord | null {
  return reviews
    .filter((review) => review.static_question_id === staticQuestionId && review.atomic_concept_id === atomicConceptId)
    .sort((left, right) => {
      const reviewedAt = right.reviewed_at.localeCompare(left.reviewed_at);
      if (reviewedAt !== 0) return reviewedAt;
      const createdAt = (right.created_at ?? '').localeCompare(left.created_at ?? '');
      return createdAt !== 0 ? createdAt : (right.id ?? '').localeCompare(left.id ?? '');
    })[0] ?? null;
}

/**
 * Verifies exact mapping, supported static MC shape, current fingerprint, and
 * the latest immutable review decision. This function never changes content or
 * treats a missing condition as a pass.
 */
export function evaluateStaticSourceEligibility(input: {
  source: StaticQuestionSource;
  atomicConceptId: string;
  lessonNumber: string;
  reviews: readonly StaticQuestionReviewRecord[];
}): StaticSourceEligibility {
  const { source, atomicConceptId, lessonNumber, reviews } = input;
  const contentSha256 = staticQuestionContentSha256(source);

  if (!source.is_active) return { eligible: false, reasonCode: 'inactive', contentSha256, options: null };
  if (source.is_verified !== true) return { eligible: false, reasonCode: 'unverified', contentSha256, options: null };
  if (source.concept_id !== lessonNumber) return { eligible: false, reasonCode: 'wrong_concept_mapping', contentSha256, options: null };
  if (source.question_type !== 'multiple_choice') {
    return { eligible: false, reasonCode: 'unsupported_question_type', contentSha256, options: null };
  }
  if (source.question_image_url || source.option_images) {
    return { eligible: false, reasonCode: 'unsupported_image_source', contentSha256, options: null };
  }
  if (!source.question_text?.trim()) return { eligible: false, reasonCode: 'missing_prompt', contentSha256, options: null };
  if (!source.explanation?.trim()) return { eligible: false, reasonCode: 'missing_explanation', contentSha256, options: null };
  if (!Number.isInteger(source.difficulty) || source.difficulty < 1 || source.difficulty > 4) {
    return { eligible: false, reasonCode: 'invalid_difficulty', contentSha256, options: null };
  }

  const options = normalizeStaticOptions(source.options);
  if (!options) return { eligible: false, reasonCode: 'invalid_options', contentSha256, options: null };
  if (!STATIC_OPTION_KEYS.includes(source.correct_answer?.trim() as StaticOptionKey)) {
    return { eligible: false, reasonCode: 'invalid_correct_answer', contentSha256, options: null };
  }
  if (source.correct_answer_index !== null && source.correct_answer_index !== undefined) {
    const expectedIndex = STATIC_OPTION_KEYS.indexOf(source.correct_answer.trim() as StaticOptionKey);
    if (source.correct_answer_index !== expectedIndex) {
      return { eligible: false, reasonCode: 'invalid_correct_answer', contentSha256, options: null };
    }
  }

  const review = latestApplicableReview(reviews, source.id, atomicConceptId);
  if (!review) return { eligible: false, reasonCode: 'missing_review_record', contentSha256, options: null };
  if (review.content_sha256 !== contentSha256) {
    return { eligible: false, reasonCode: 'review_fingerprint_mismatch', contentSha256, options: null };
  }
  if (review.deterministic_result !== 'pass' || review.decision !== 'approved') {
    return { eligible: false, reasonCode: 'review_not_approved', contentSha256, options: null };
  }

  return { eligible: true, reasonCode: 'eligible', contentSha256, options };
}

export function isStaticSourceApproved(input: Parameters<typeof evaluateStaticSourceEligibility>[0]): boolean {
  return evaluateStaticSourceEligibility(input).eligible;
}
