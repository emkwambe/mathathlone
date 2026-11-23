import { describe, expect, it, vi } from 'vitest';
import { followBillingRedirect } from './billing-redirect';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('followBillingRedirect (used by the Manage billing and Upgrade to Pro buttons)', () => {
  it('POSTs to /api/billing/portal and navigates to the returned portal URL', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { url: 'https://billing.stripe.com/p/session?secret=test_x' }));
    const navigate = vi.fn();
    await followBillingRedirect('/api/billing/portal', {}, 'fallback', { fetch: fetchMock as unknown as typeof fetch, navigate });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(navigate).toHaveBeenCalledWith('https://billing.stripe.com/p/session?secret=test_x');
  });

  it('POSTs the plan to /api/billing/checkout and navigates to Checkout', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { url: 'https://checkout.stripe.com/c/pay/cs_test_x' }));
    const navigate = vi.fn();
    await followBillingRedirect('/api/billing/checkout', { plan: 'pro' }, 'fallback', { fetch: fetchMock as unknown as typeof fetch, navigate });
    expect(fetchMock).toHaveBeenCalledWith('/api/billing/checkout', expect.objectContaining({ method: 'POST', body: '{"plan":"pro"}' }));
    expect(navigate).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_x');
  });

  it('does not navigate and throws the server message when the route refuses', async () => {
    const navigate = vi.fn();
    const fetchMock = vi.fn(async () => jsonResponse(404, { error: 'This account has no billing record yet.', code: 'no_customer' }));
    await expect(followBillingRedirect('/api/billing/portal', {}, 'fallback', { fetch: fetchMock as unknown as typeof fetch, navigate }))
      .rejects.toThrow('This account has no billing record yet.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not navigate and throws the fallback when the response has no URL or is not JSON', async () => {
    const navigate = vi.fn();
    const noUrl = vi.fn(async () => jsonResponse(200, {}));
    await expect(followBillingRedirect('/api/billing/portal', {}, 'Could not open billing.', { fetch: noUrl as unknown as typeof fetch, navigate }))
      .rejects.toThrow('Could not open billing.');
    const notJson = vi.fn(async () => new Response('<html>', { status: 500 }));
    await expect(followBillingRedirect('/api/billing/portal', {}, 'Could not open billing.', { fetch: notJson as unknown as typeof fetch, navigate }))
      .rejects.toThrow('Could not open billing.');
    expect(navigate).not.toHaveBeenCalled();
  });
});
