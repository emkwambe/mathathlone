import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

// Role precedence: highest-privilege role wins (matches the JWT hook ordering)
const ROLE_PRECEDENCE: Record<string, number> = {
  platform_admin: 1,
  district_admin: 2,
  school_admin: 3,
  teacher: 4,
  broadcast_host: 5,
  parent: 6,
  mathlete: 7,
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Read from user_roles (the new authoritative source). Pick the
  // highest-privilege active role for routing.
  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (!roleRows || roleRows.length === 0) {
    // No role assigned yet — fall back to mathlete dashboard
    redirect('/dashboard/athlete');
  }

  // Sort by precedence and pick the top one
  const topRole = [...roleRows]
    .sort((a, b) => (ROLE_PRECEDENCE[a.role] ?? 99) - (ROLE_PRECEDENCE[b.role] ?? 99))[0]
    .role;

  switch (topRole) {
    case 'platform_admin':
      redirect('/dashboard/admin');         // platform admins use school admin UI for now
    case 'district_admin':
      redirect('/dashboard/admin');         // district admins use school admin UI for now
    case 'school_admin':
      redirect('/dashboard/admin');
    case 'teacher':
      redirect('/dashboard/teacher');
    case 'broadcast_host':
      redirect('/dashboard/broadcast');
    case 'parent':
      redirect('/dashboard/parent');
    case 'mathlete':
    default:
      redirect('/dashboard/athlete');
  }
}