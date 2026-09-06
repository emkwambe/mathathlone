import { describe, expect, it } from 'vitest';

import {
  getImplementedPracticeConceptIds,
  getImplementedPracticeGeneratorCandidates,
} from './practice-generator-availability';

describe('practice generator availability', () => {
  it('retains only active mappings implemented by the deterministic generator registry', () => {
    const rows = [
      { concept_id: 'unit-rate', generator_type: 'g6_rp_calculate_unit_rate' },
      { concept_id: 'inactive-concept', generator_type: 'not_implemented' },
    ];

    expect(getImplementedPracticeGeneratorCandidates(rows)).toEqual([
      { conceptId: 'unit-rate', generatorType: 'g6_rp_calculate_unit_rate' },
    ]);
    expect(getImplementedPracticeConceptIds(rows)).toEqual(new Set(['unit-rate']));
  });

  it('does not infer availability when no active implemented mapping exists', () => {
    expect(getImplementedPracticeGeneratorCandidates([
      { concept_id: 'unavailable', generator_type: 'not_implemented' },
    ])).toEqual([]);
    expect(getImplementedPracticeConceptIds([]).size).toBe(0);
  });
});
