/** Billing routes the class console may start a redirect from. */
export type BillingRedirectPath = '/api/billing/checkout' | '/api/billing/portal';

export interface BillingRedirectDeps {
  fetch: typeof fetch;
  navigate: (url: string) => void;
}

const browserDeps = (): BillingRedirectDeps => ({
  fetch: (...args) => fetch(...args),
  navigate: (url) => window.location.assign(url),
});

/**
 * POSTs to a billing route and follows the Stripe URL it returns (Checkout or Billing Portal).
 * Throws with the server's error message, or `fallback`, when there is no URL to follow.
 */
export async function followBillingRedirect(
  path: BillingRedirectPath,
  body: unknown,
  fallback: string,
  deps: BillingRedirectDeps = browserDeps(),
): Promise<void> {
  const response = await deps.fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as { url?: unknown; error?: unknown } | null;
  if (!response.ok || typeof payload?.url !== 'string') {
    throw new Error(typeof payload?.error === 'string' ? payload.error : fallback);
  }
  deps.navigate(payload.url);
}
