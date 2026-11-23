import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

// Real src/lib/billing.ts and the real kit; only the server-only marker and the session are mocked.
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: async () => ({ auth: { getUser: async () => ({ data: { user: null }, error: null }) } }),
}));

const { billingEnabled } = await import('@/lib/billing');
const checkout = await import('./checkout/route');
const portal = await import('./portal/route');
const webhook = await import('./webhook/route');

const STRIPE_VARS = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] as const;
const saved: Record<string, string | undefined> = {};
let fetchSpy: MockInstance<typeof fetch>;

const post = (path: string, body = '{}') =>
  new Request(`http://localhost:3000${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });

beforeEach(() => {
  saved.BILLING_MODE = process.env.BILLING_MODE;
  for (const name of STRIPE_VARS) { saved[name] = process.env[name]; delete process.env[name]; }
  fetchSpy = vi.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  for (const [name, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
  fetchSpy.mockRestore();
});

describe('billingEnabled', () => {
  it('is on only for the exact value "on"; default and anything else is off', () => {
    delete process.env.BILLING_MODE;
    expect(billingEnabled()).toBe(false);
    for (const value of ['', 'off', 'ON', 'On', 'true', '1', 'yes', ' on']) {
      process.env.BILLING_MODE = value;
      expect(billingEnabled()).toBe(false);
    }
    process.env.BILLING_MODE = 'on';
    expect(billingEnabled()).toBe(true);
  });
});

describe('BILLING_MODE off', () => {
  it('returns 404 from all three billing routes with no Stripe variables set and no network call', async () => {
    delete process.env.BILLING_MODE;
    for (const [route, path] of [[checkout, '/api/billing/checkout'], [portal, '/api/billing/portal'], [webhook, '/api/billing/webhook']] as const) {
      const res = await route.POST(post(path));
      expect(res.status).toBe(404);
    }
    process.env.BILLING_MODE = 'off';
    expect((await checkout.POST(post('/api/billing/checkout', '{"plan":"pro"}'))).status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('BILLING_MODE on', () => {
  it('checkout and portal return 401 when signed out, and an unsigned webhook returns 400, without calling Stripe', async () => {
    process.env.BILLING_MODE = 'on';
    expect((await checkout.POST(post('/api/billing/checkout', '{"plan":"pro"}'))).status).toBe(401);
    expect((await portal.POST(post('/api/billing/portal'))).status).toBe(401);
    expect((await webhook.POST(post('/api/billing/webhook', '{"id":"evt_unsigned"}'))).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
