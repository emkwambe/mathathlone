import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CheckCircle2, ChevronLeft, Clock, RefreshCw } from 'lucide-react';
import { billing, billingEnabled, currentBillingSubject, PRO_FEATURE } from '@/lib/billing';

export const dynamic = 'force-dynamic';

/**
 * Stripe Checkout returns here. Reconciles the user's grants from Stripe straight away, so access
 * does not wait for the webhook, then shows the plan state from the local grants table.
 */
export default async function BillingSuccessPage() {
  if (!billingEnabled()) notFound();
  const context = await currentBillingSubject();
  if (!context) redirect('/auth/login?next=/dashboard/teacher/billing/success');

  try {
    await billing.reconcile(context.subject);
  } catch (error: unknown) {
    // The webhook will still deliver the change; the page simply shows the current state.
    console.error('[billing] reconcile after checkout failed:', error instanceof Error ? error.message : 'unknown error');
  }
  const isPro = await billing.can(context.subject, PRO_FEATURE);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard/teacher/classes" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-700">
          <ChevronLeft className="h-4 w-4" /> Back to classes
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Billing</p>
          {isPro ? (
            <div className="mt-3 flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">MathAthlone Pro is active</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">Your account now has unlimited classes. You can manage or cancel your plan any time from the Manage billing button on your classes page.</p>
                <Link href="/dashboard/teacher/classes" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Go to my classes</Link>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-3">
              <Clock className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">Confirming your Pro plan</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">Stripe has not confirmed your Pro access yet. This usually takes a few seconds. Refresh this page in a moment. If it still shows this message, your classes page will update once the payment is confirmed.</p>
                <Link href="/dashboard/teacher/billing/success" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Check again</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
