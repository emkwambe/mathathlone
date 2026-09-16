import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import {
  dashboardPathForRole,
  highestActiveDashboardRole,
} from '@/lib/auth/dashboard-routing';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // user_roles is the authoritative source. A display name, a legacy profile
  // field, and the role selected on the login screen must never override the
  // highest active role assignment.
  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true);

  const highestRole = highestActiveDashboardRole(
    (roleRows ?? []).map((row) => row.role),
  );

  redirect(dashboardPathForRole(highestRole));
}
