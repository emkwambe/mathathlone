import { describe, expect, it } from 'vitest';
import {
  classHeatEntryRoleLabel,
  isEducatorClassHeatAccount,
  isEducatorClassHeatRole,
  shouldAutoJoinClassHeat,
} from './class-heat-entry';

describe('class Heat entry role routing', () => {
  it('recognizes every educator role and excludes Mathletes', () => {
    for (const role of ['teacher', 'school_admin', 'district_admin', 'platform_admin', 'broadcast_host']) {
      expect(isEducatorClassHeatRole(role)).toBe(true);
    }

    expect(isEducatorClassHeatRole('mathlete')).toBe(false);
    expect(isEducatorClassHeatRole(null)).toBe(false);
  });

  it('uses either current role signal conservatively for educator routing', () => {
    expect(isEducatorClassHeatAccount({ claimedRole: 'teacher', profileRole: 'mathlete' })).toBe(true);
    expect(isEducatorClassHeatAccount({ claimedRole: 'mathlete', profileRole: 'school_admin' })).toBe(true);
    expect(isEducatorClassHeatAccount({ claimedRole: 'mathlete', profileRole: 'mathlete' })).toBe(false);
  });

  it('permits auto-join only for non-educator non-host accounts', () => {
    expect(shouldAutoJoinClassHeat({ isHeatCreator: false, isEducatorAccount: false })).toBe(true);
    expect(shouldAutoJoinClassHeat({ isHeatCreator: true, isEducatorAccount: true })).toBe(false);
    expect(shouldAutoJoinClassHeat({ isHeatCreator: false, isEducatorAccount: true })).toBe(false);
  });

  it('uses the available role label only for non-authoritative display copy', () => {
    expect(classHeatEntryRoleLabel({ claimedRole: 'teacher', profileRole: 'mathlete' })).toBe('teacher');
    expect(classHeatEntryRoleLabel({ claimedRole: null, profileRole: 'mathlete' })).toBe('mathlete');
    expect(classHeatEntryRoleLabel({})).toBe('mathlete');
  });
});
