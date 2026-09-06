import { GENERATORS } from '../competition/generators';

export interface PracticeGeneratorRow {
  concept_id: string;
  generator_type: string;
}

export interface PracticeGeneratorCandidate {
  conceptId: string;
  generatorType: string;
}

const KNOWN_GENERATOR_KEYS = new Set(Object.keys(GENERATORS));

/**
 * Converts active database mappings into the subset actually implemented by the
 * deterministic procedural-generator registry. The function is intentionally
 * server-only: it does not create questions or expose answer logic.
 */
export function getImplementedPracticeGeneratorCandidates(
  rows: readonly PracticeGeneratorRow[],
): PracticeGeneratorCandidate[] {
  return rows
    .filter((generator) => KNOWN_GENERATOR_KEYS.has(generator.generator_type))
    .map((generator) => ({
      conceptId: generator.concept_id,
      generatorType: generator.generator_type,
    }));
}

export function getImplementedPracticeConceptIds(
  rows: readonly PracticeGeneratorRow[],
): Set<string> {
  return new Set(
    getImplementedPracticeGeneratorCandidates(rows).map((candidate) => candidate.conceptId),
  );
}
