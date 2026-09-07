import { describe, expect, it } from 'vitest';

import { visualGeneratorCapacityForScope } from './question-delivery';

describe('explicit concept scope question delivery', () => {
  it('disables the unmapped visual pool for one selected atomic concept', () => {
    expect(visualGeneratorCapacityForScope(['concept-a'])).toBe(0);
  });

  it('disables the unmapped visual pool for several selected atomic concepts', () => {
    expect(visualGeneratorCapacityForScope(['concept-a', 'concept-b', 'concept-c'])).toBe(0);
  });

  it('retains visual capacity only for legacy topic-wide selection paths', () => {
    expect(visualGeneratorCapacityForScope(null)).toBeGreaterThan(0);
    expect(visualGeneratorCapacityForScope([])).toBeGreaterThan(0);
  });
});
