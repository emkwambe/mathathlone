import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const TEACHER_ID = '11111111-1111-4111-8111-111111111111';

const state = vi.hoisted(() => ({
  mode: 'on' as 'on' | 'off',
  user: null as null | { id: string },
  activeCount: 0,
  countFails: false,
  countQueries: 0,
  inserted: [] as Record<string, unknown>[],
  can: vi.fn(async () => false),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { id: TEACHER_ID, role: 'teacher', school_id: 'school-1', display_name: 'T', is_active: true },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      let head = false;
      const query = {
        select: (_columns?: string, options?: { head?: boolean }) => { if (options?.head) { head = true; state.countQueries += 1; } return query; },
        eq: () => query,
        insert: (row: Record<string, unknown>) => { state.inserted.push(row); return query; },
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: { id: 'class-new', ...state.inserted.at(-1) }, error: null }),
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(head
            ? (state.countFails ? { count: null, error: { message: 'connection refused' } } : { count: state.activeCount, error: null })
            : { data: null, error: null }).then(resolve, reject),
      };
      return query;
    },
  }),
}));

vi.mock('@/lib/billing', () => ({
  billing: { can: state.can },
  billingEnabled: () => state.mode === 'on',
  FREE_CLASSROOM_LIMIT: 3,
  PRO_FEATURE: 'unlimited_classrooms',
}));

const { POST } = await import('./route');

function createClassRequest(body: unknown = { name: 'Grade 7 Math', grade_level: 7 }) {
  return new Request('https://mathathlone.test/api/classes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  state.mode = 'on';
  state.countQueries = 0;
  state.user = { id: TEACHER_ID };
  state.activeCount = 0;
  state.countFails = false;
  state.inserted = [];
  state.can.mockReset();
  state.can.mockResolvedValue(false);
});

describe('POST /api/classes: free-plan classroom limit', () => {
  it('creates a class when the teacher has fewer than 3 active classes, without an entitlement check', async () => {
    state.activeCount = 2;
    const res = await POST(createClassRequest());
    expect(res.status).toBe(201);
    expect(state.inserted).toHaveLength(1);
    expect(state.can).not.toHaveBeenCalled();
  });

  it('refuses the fourth active class without Pro: 402 upgrade_required, nothing inserted', async () => {
    state.activeCount = 3;
    const res = await POST(createClassRequest());
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.code).toBe('upgrade_required');
    expect(body.error).toBe('The free plan includes 3 active classes. Upgrade to MathAthlone Pro for unlimited classes.');
    expect(state.inserted).toHaveLength(0);
    expect(state.can).toHaveBeenCalledWith({ type: 'user', id: TEACHER_ID }, 'unlimited_classrooms');
  });

  it('allows the fourth active class with Pro', async () => {
    state.activeCount = 3;
    state.can.mockResolvedValue(true);
    const res = await POST(createClassRequest());
    expect(res.status).toBe(201);
    expect(state.inserted).toHaveLength(1);
  });

  it('refuses beyond the limit, for example at 7 active classes without Pro', async () => {
    state.activeCount = 7;
    expect((await POST(createClassRequest())).status).toBe(402);
    expect(state.inserted).toHaveLength(0);
  });

  it('fails closed when the active-class count cannot be read: 503, nothing inserted, no entitlement check', async () => {
    state.countFails = true;
    const res = await POST(createClassRequest());
    expect(res.status).toBe(503);
    expect(state.inserted).toHaveLength(0);
    expect(state.can).not.toHaveBeenCalled();
  });

  it('still returns 401 for a signed-out request before any limit check', async () => {
    state.user = null;
    const res = await POST(createClassRequest());
    expect(res.status).toBe(401);
    expect(state.can).not.toHaveBeenCalled();
  });
});

describe('POST /api/classes: BILLING_MODE off', () => {
  it('never blocks class creation, at any number of active classes, and never runs the limit query or the entitlement check', async () => {
    state.mode = 'off';
    for (const activeCount of [0, 3, 7, 50]) {
      state.activeCount = activeCount;
      const res = await POST(createClassRequest({ name: `Class at ${activeCount}`, grade_level: 7 }));
      expect(res.status).toBe(201);
    }
    expect(state.inserted).toHaveLength(4);
    expect(state.countQueries).toBe(0);
    expect(state.can).not.toHaveBeenCalled();
  });

  it('does not fail closed on the limit query, because the query is not run', async () => {
    state.mode = 'off';
    state.countFails = true;
    const res = await POST(createClassRequest());
    expect(res.status).toBe(201);
    expect(state.countQueries).toBe(0);
  });
});