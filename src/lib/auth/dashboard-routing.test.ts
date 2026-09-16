import { describe, expect, it } from 'vitest';
import {
  dashboardPathForRole,
  highestActiveDashboardRole,
  isMathleteDashboardRole,
} from './dashboard-routing';

describe('dashboard role routing', () => {
  it('chooses the highest active role independently of display-name or form choice', () => {
    expect(highestActiveDashboardRole(['mathlete', 'teacher'])).toBe('teacher');
    expect(highestActiveDashboardRole(['mathlete', 'school_admin'])).toBe('school_admin');
    expect(highestActiveDashboardRole(['mathlete'])).toBe('mathlete');
    expect(highestActiveDashboardRole([])).toBeNull();
  });

  it('uses the intended server dashboard path for every resolved role', () => {
    expect(dashboardPathForRole('teacher')).toBe('/dashboard/teacher');
    expect(dashboardPathForRole('school_admin')).toBe('/dashboard/admin');
    expect(dashboardPathForRole('district_admin')).toBe('/dashboard/admin');
    expect(dashboardPathForRole('platform_admin')).toBe('/dashboard/platform/pilot');
    expect(dashboardPathForRole('mathlete')).toBe('/dashboard/athlete');
    expect(dashboardPathForRole(null)).toBe('/dashboard/athlete');
  });

  it('identifies only a resolved Mathlete or no-role account as Mathlete Home eligible', () => {
    expect(isMathleteDashboardRole('mathlete')).toBe(true);
    expect(isMathleteDashboardRole(null)).toBe(true);
    expect(isMathleteDashboardRole('teacher')).toBe(false);
    expect(isMathleteDashboardRole('school_admin')).toBe(false);
  });
});
