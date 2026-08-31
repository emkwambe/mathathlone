import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { createSupabaseServer } from '@/lib/supabase/server';
import PilotOrganizationConsole from '@/components/platform/PilotOrganizationConsole';

export const dynamic = 'force-dynamic';

export default async function PilotAdministrationPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/dashboard/platform/pilot');

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'platform_admin') redirect('/403');

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <header className="mb-8 flex items-start gap-4">
          <div className="rounded-xl bg-indigo-500/15 p-3"><ShieldCheck className="h-7 w-7 text-indigo-300" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Platform administrator</p>
            <h1 className="mt-1 text-3xl font-bold">Pilot Organization Setup</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Establish the three-school pilot hierarchy and assign registered staff to the correct school or district scope. Classroom rosters and competition event setup arrive in the next pilot releases.
            </p>
          </div>
        </header>
        <PilotOrganizationConsole />
      </div>
    </main>
  );
}
