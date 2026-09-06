import { describe, expect, it } from 'vitest';

import {
  getCourseContentReadiness,
  getSelectedContentReadiness,
  hasCuratedAnnouncedSkill,
} from './readiness';

describe('content readiness registry', () => {
  it('recognizes the recorded Grade 6 ratios scope without certifying classroom readiness', () => {
    const readiness = getSelectedContentReadiness('G6', [
      { id: 'one', lesson_number: 'M6.RP.1.3' },
      { id: 'two', lesson_number: 'M6.RP.2.1' },
      { id: 'three', lesson_number: 'M6.RP.2.3' },
    ]);

    expect(readiness.status).toBe('controlled_acceptance_in_progress');
    expect(readiness.classroomReady).toBe(false);
  });

  it('does not extend Grade 6 audit status to a mixed selection', () => {
    const readiness = getSelectedContentReadiness('G6', [
      { id: 'reviewed', lesson_number: 'M6.RP.1.3' },
      { id: 'unreviewed', lesson_number: 'M6.RP.3.2' },
    ]);

    expect(readiness.status).toBe('not_audited');
    expect(readiness.label).toBe('No recorded audit for this content scope');
    expect(readiness.summary).toContain('separately recorded platform, security, roster');
    expect(readiness.classroomReady).toBe(false);
  });

  it('distinguishes the recorded Math 1 source-calibrated scope from classroom readiness', () => {
    const readiness = getSelectedContentReadiness('NCM1', [
      { id: 'one', lesson_number: 'M1.EQN.2.2' },
      { id: 'two', lesson_number: 'M1.EQN.2.5' },
    ]);

    expect(readiness.status).toBe('source_calibrated_pending_educator');
    expect(readiness.classroomReady).toBe(false);
  });

  it('uses the limited-scope warning before course concepts are selected', () => {
    expect(getCourseContentReadiness('G6').label).toContain('Limited audit record');
    expect(getCourseContentReadiness('G6').summary).toContain('does not negate separately recorded platform or operational verification');
    expect(getCourseContentReadiness('unknown-course').label).toBe('No recorded audit for this content scope');
  });

  it('requires an actual manual label instead of accepting blank text', () => {
    expect(hasCuratedAnnouncedSkill('Calculate a unit rate')).toBe(true);
    expect(hasCuratedAnnouncedSkill('   ')).toBe(false);
    expect(hasCuratedAnnouncedSkill(null)).toBe(false);
  });
});
