import { describe, expect, it } from 'vitest';

import { classifyConceptAvailability } from './concept-availability';

const implementedGenerator = {
  concept_id: 'procedural-id',
  generator_type: 'g6_rp_calculate_unit_rate',
};

describe('classifyConceptAvailability', () => {
  it('accepts a concept only when an active mapping has an implemented deterministic runtime key', () => {
    const result = classifyConceptAvailability({
      conceptId: 'procedural-id',
      generatorRows: [implementedGenerator],
      verifiedStaticItemCount: 0,
      unverifiedStaticItemCount: 0,
    });

    expect(result).toMatchObject({
      conceptId: 'procedural-id',
      sourceState: 'procedural',
      implementedGeneratorTypes: ['g6_rp_calculate_unit_rate'],
      deliveryAvailable: true,
      unavailableReason: null,
    });
  });

  it('records verified static coverage without falsely declaring current worksheet or Heat delivery support', () => {
    const result = classifyConceptAvailability({
      conceptId: 'static-id',
      generatorRows: [],
      verifiedStaticItemCount: 3,
      unverifiedStaticItemCount: 0,
    });

    expect(result).toMatchObject({
      conceptId: 'static-id',
      sourceState: 'static',
      deliveryAvailable: false,
    });
    expect(result.unavailableReason).toContain('verified static question source');
  });

  it('does not treat active unverified static items as an approved source', () => {
    const result = classifyConceptAvailability({
      conceptId: 'unverified-static-id',
      generatorRows: [],
      verifiedStaticItemCount: 0,
      unverifiedStaticItemCount: 2,
    });

    expect(result).toMatchObject({
      sourceState: 'unverified_static',
      deliveryAvailable: false,
    });
    expect(result.unavailableReason).toContain('not yet verified');
  });

  it('fails closed when a database mapping points to a generator key absent from the runtime registry', () => {
    const result = classifyConceptAvailability({
      conceptId: 'unknown-generator-id',
      generatorRows: [{ concept_id: 'unknown-generator-id', generator_type: 'not_implemented' }],
      verifiedStaticItemCount: 0,
      unverifiedStaticItemCount: 0,
    });

    expect(result).toMatchObject({
      sourceState: 'unavailable',
      implementedGeneratorTypes: [],
      deliveryAvailable: false,
    });
  });

  it('reports mixed source evidence without changing the explicit generator delivery contract', () => {
    const result = classifyConceptAvailability({
      conceptId: 'mixed-id',
      generatorRows: [{ ...implementedGenerator, concept_id: 'mixed-id' }],
      verifiedStaticItemCount: 1,
      unverifiedStaticItemCount: 2,
    });

    expect(result).toMatchObject({
      sourceState: 'mixed',
      deliveryAvailable: true,
      verifiedStaticItemCount: 1,
      unverifiedStaticItemCount: 2,
    });
  });
});
