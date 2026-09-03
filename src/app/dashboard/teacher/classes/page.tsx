import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createSupabaseServer } from '@/lib/supabase/server';
import ClassRosterConsole from '@/components/classes/ClassRosterConsole';

export const dynamic = 'force-dynamic';

export default async function TeacherClassesPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/dashboard/teacher/classes');

  const { data: profile } = await supabase
    .from('users')
    .select('role, school_id, display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'teacher') redirect('/403');

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard/teacher" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-700">
          <ChevronLeft className="h-4 w-4" /> Back to teacher dashboard
        </Link>
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Classroom operations</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Classes and Mathlete access</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Set up the classes you teach, import only the students on each roster, and prepare private Mathlete login cards before a classroom Heat.</p>
        </div>
        <ClassRosterConsole />
      </div>
    </main>
  );
}
