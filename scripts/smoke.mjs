// Billing smoke test. Base URL and billing mode are both required:
//   $env:SMOKE_BASE_URL = 'https://example.vercel.app'; $env:SMOKE_BILLING = 'off'; npm run smoke
//   npm run smoke -- http://localhost:3000        (with SMOKE_BILLING set)
// SMOKE_BILLING=off: the billing routes must return 404. SMOKE_BILLING=on: 401 (checkout) and 400 (unsigned webhook).
const base = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? '').replace(/\/+$/, '');
const mode = process.env.SMOKE_BILLING;
if (!/^https?:\/\/[^/]+/.test(base)) {
  console.error('REFUSED: set the base URL explicitly (first argument or SMOKE_BASE_URL).');
  process.exit(2);
}
if (mode !== 'on' && mode !== 'off') {
  console.error('REFUSED: set SMOKE_BILLING to "on" or "off" to match the deployment\'s BILLING_MODE.');
  process.exit(2);
}

const postJson = (path, body) => fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body, redirect: 'manual' });

const checks = [
  {
    name: 'pricing page (/ with #pricing section) returns 200',
    run: async () => {
      const res = await fetch(`${base}/`, { redirect: 'manual' });
      const body = await res.text();
      return { ok: res.status === 200 && body.includes('id="pricing"'), detail: `status ${res.status}, pricing section ${body.includes('id="pricing"') ? 'present' : 'missing'}` };
    },
  },
  ...(mode === 'on'
    ? [
        { name: 'unauthenticated POST /api/billing/checkout returns 401', expect: 401, path: '/api/billing/checkout', body: '{"plan":"pro"}' },
        { name: 'unsigned POST /api/billing/webhook returns 400', expect: 400, path: '/api/billing/webhook', body: '{"id":"evt_smoke_unsigned"}' },
      ]
    : [
        { name: 'POST /api/billing/checkout returns 404 (billing off)', expect: 404, path: '/api/billing/checkout', body: '{"plan":"pro"}' },
        { name: 'POST /api/billing/portal returns 404 (billing off)', expect: 404, path: '/api/billing/portal', body: '{}' },
        { name: 'POST /api/billing/webhook returns 404 (billing off)', expect: 404, path: '/api/billing/webhook', body: '{"id":"evt_smoke_unsigned"}' },
      ]
  ).map((c) => ({
    name: c.name,
    run: async () => {
      const res = await postJson(c.path, c.body);
      return { ok: res.status === c.expect, detail: `status ${res.status}` };
    },
  })),
];

console.log(`smoke: ${base} (billing ${mode})`);
let failed = 0;
for (const check of checks) {
  try {
    const { ok, detail } = await check.run();
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${check.name}  (${detail})`);
  } catch (error) {
    failed++;
    console.log(`FAIL  ${check.name}  (${error instanceof Error ? error.message : 'request failed'})`);
  }
}
console.log(failed === 0 ? `smoke: all ${checks.length} checks passed` : `smoke: ${failed} of ${checks.length} checks failed`);
process.exit(failed === 0 ? 0 : 1);
