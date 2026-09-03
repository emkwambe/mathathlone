'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, KeyRound, Loader2, Plus, Printer, RefreshCw, Users } from 'lucide-react';

type Classroom = {
  id: string;
  name: string;
  grade_level: number;
  join_code: string;
  roster_count: number;
};

type RosterStudent = {
  enrollment_id: string;
  athlete: {
    id: string;
    display_name: string;
    managed_username: string | null;
    grade_level: number | null;
    is_active: boolean;
  } | null;
};

type Credential = {
  athlete_id: string;
  display_name: string;
  username: string;
  pin: string;
  already_existed: boolean;
};

function apiError(payload: unknown, fallback: string): string {
  return typeof payload === 'object' && payload !== null && 'error' in payload && typeof (payload as any).error === 'string'
    ? (payload as any).error
    : fallback;
}

export default function ClassRosterConsole() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [rosterNames, setRosterNames] = useState('');
  const [importing, setImporting] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const selectedClass = useMemo(
    () => classes.find((classroom) => classroom.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const response = await fetch('/api/classes', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Could not load your classes.'));
      const nextClasses = (payload?.classes ?? []) as Classroom[];
      setClasses(nextClasses);
      setSelectedClassId((current) => current && nextClasses.some((classroom) => classroom.id === current)
        ? current
        : nextClasses[0]?.id ?? null);
    } catch (err: any) {
      setError(err?.message ?? 'Could not load your classes.');
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadRoster = useCallback(async (classId: string) => {
    setLoadingRoster(true);
    try {
      const response = await fetch(`/api/classes/${classId}/roster/import`, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Could not load this roster.'));
      setRoster((payload?.roster ?? []) as RosterStudent[]);
    } catch (err: any) {
      setError(err?.message ?? 'Could not load this roster.');
    } finally {
      setLoadingRoster(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => {
    setCredentials([]);
    setRoster([]);
    if (selectedClassId) loadRoster(selectedClassId);
  }, [selectedClassId, loadRoster]);

  const createClass = async (event: FormEvent) => {
    event.preventDefault();
    setError(null); setSuccess(null); setCredentials([]);
    const grade = Number(gradeLevel);
    if (!name.trim() || !Number.isInteger(grade)) {
      setError('Enter a class name and choose a grade.');
      return;
    }
    setCreatingClass(true);
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade_level: grade }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Could not create the class.'));
      setName(''); setGradeLevel('');
      setSuccess(`${payload.classroom.name} was created. Add the roster next.`);
      await loadClasses();
      setSelectedClassId(payload.classroom.id);
    } catch (err: any) {
      setError(err?.message ?? 'Could not create the class.');
    } finally {
      setCreatingClass(false);
    }
  };

  const importRoster = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedClassId) return;
    setError(null); setSuccess(null); setCredentials([]);
    const names = rosterNames.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
    if (names.length === 0) {
      setError('Paste one student name per line.');
      return;
    }
    setImporting(true);
    try {
      const response = await fetch(`/api/classes/${selectedClassId}/roster/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Could not import the roster.'));
      setCredentials((payload?.imported ?? []) as Credential[]);
      setRosterNames('');
      const skipped = (payload?.skipped ?? []).length;
      setSuccess(`${(payload?.imported ?? []).length} Mathlete${(payload?.imported ?? []).length === 1 ? '' : 's'} added${skipped ? `; ${skipped} need attention` : ''}. Print the new login cards now—PINs are shown only once.`);
      await loadRoster(selectedClassId);
      await loadClasses();
    } catch (err: any) {
      setError(err?.message ?? 'Could not import the roster.');
    } finally {
      setImporting(false);
    }
  };

  const resetPin = async (student: RosterStudent) => {
    if (!selectedClassId || !student.athlete?.managed_username) return;
    setError(null); setSuccess(null);
    const confirmed = window.confirm(`Create a new temporary PIN for ${student.athlete.display_name}? The previous PIN will stop working immediately.`);
    if (!confirmed) return;
    setResettingId(student.athlete.id);
    try {
      const response = await fetch(`/api/classes/${selectedClassId}/roster/${student.athlete.id}/reset-pin`, { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Could not reset the temporary PIN.'));
      setCredentials([{ athlete_id: payload.athlete_id, display_name: payload.display_name, username: payload.username, pin: payload.pin, already_existed: false }]);
      setSuccess(`A new temporary PIN was generated for ${payload.display_name}. Give it directly to the student and print the card now.`);
    } catch (err: any) {
      setError(err?.message ?? 'Could not reset the temporary PIN.');
    } finally {
      setResettingId(null);
    }
  };

  const printCards = () => window.print();
  const copyClassCode = async () => {
    if (!selectedClass) return;
    await navigator.clipboard?.writeText(selectedClass.join_code);
    setSuccess(`Class code ${selectedClass.join_code} copied.`);
  };

  return (
    <section className="space-y-6">
      <style jsx global>{`@media print { .no-print { display: none !important; } .print-cards { display: grid !important; } }`}</style>

      <div className="no-print rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Pilot classrooms</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Create a class and prepare Mathlete access</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Create each pilot class once, import its roster before class, and give new students their private login cards. A classroom Heat can then admit only its active roster.</p>
          </div>
          <button type="button" onClick={loadClasses} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>

        {error && <Notice tone="error" text={error} />}
        {success && <Notice tone="success" text={success} />}

        <form onSubmit={createClass} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-[1fr_150px_auto]">
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="Class name, e.g. Grade 7 Math — Period 2" className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500" />
          <select value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500">
            <option value="">Grade level</option>
            {[3,4,5,6,7,8,9,10,11,12].map((grade) => <option key={grade} value={grade}>Grade {grade}</option>)}
          </select>
          <button type="submit" disabled={creatingClass} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{creatingClass ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create class</button>
        </form>
      </div>

      <div className="no-print grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Users className="h-4 w-4 text-indigo-600" /> My classes</h3>
          {loadingClasses ? <p className="mt-4 text-sm text-slate-500">Loading classes…</p> : classes.length === 0 ? <p className="mt-4 text-sm leading-6 text-slate-500">Create your first pilot class above. Each teacher should create only the classes they teach.</p> : <div className="mt-3 space-y-2">{classes.map((classroom) => <button type="button" key={classroom.id} onClick={() => setSelectedClassId(classroom.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedClassId === classroom.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}><p className="font-semibold text-slate-900">{classroom.name}</p><p className="mt-1 text-xs text-slate-500">Grade {classroom.grade_level} · {classroom.roster_count} rostered</p></button>)}</div>}
        </aside>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {!selectedClass ? <div className="py-10 text-center text-sm text-slate-500">Select a class to view its roster and prepare student login cards.</div> : <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
              <div><h3 className="text-lg font-bold text-slate-900">{selectedClass.name}</h3><p className="mt-1 text-sm text-slate-600">Grade {selectedClass.grade_level} · Class code <span className="font-mono font-semibold text-slate-800">{selectedClass.join_code}</span></p></div>
              <button type="button" onClick={copyClassCode} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" /> Copy class code</button>
            </div>

            <form onSubmit={importRoster} className="mt-5">
              <label className="text-sm font-semibold text-slate-800">Add Mathletes</label>
              <p className="mt-1 text-xs leading-5 text-slate-500">Paste one privacy-safe student display name per line. New managed accounts receive a username and one-time temporary PIN. Existing students are enrolled without showing a credential.</p>
              <textarea value={rosterNames} onChange={(event) => setRosterNames(event.target.value)} rows={6} placeholder={'Amara O.\nJordan C.\nPriya S.'} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500" />
              <button type="submit" disabled={importing} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Add roster and issue cards</button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5"><h4 className="font-semibold text-slate-900">Active roster ({roster.length})</h4>{loadingRoster ? <p className="mt-3 text-sm text-slate-500">Loading roster…</p> : roster.length === 0 ? <p className="mt-3 text-sm text-slate-500">No Mathletes yet. Add the class roster above before starting a classroom Heat.</p> : <div className="mt-3 divide-y divide-slate-100">{roster.map((student) => <div key={student.enrollment_id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium text-slate-800">{student.athlete?.display_name ?? 'Unknown Mathlete'}</p><p className="text-xs text-slate-500">{student.athlete?.managed_username ? `Managed login: ${student.athlete.managed_username}` : 'Existing Mathlete account'}{student.athlete?.grade_level ? ` · Grade ${student.athlete.grade_level}` : ''}</p></div>{student.athlete?.managed_username && <button type="button" disabled={resettingId === student.athlete.id} onClick={() => resetPin(student)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50">{resettingId === student.athlete.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />} Reset PIN</button>}</div>)}</div>}</div>
          </>}
        </div>
      </div>

      {credentials.length > 0 && <section className="print-cards rounded-2xl border border-amber-200 bg-amber-50 p-6"><div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-amber-950">New Mathlete login cards</h3><p className="mt-1 text-sm text-amber-800">Print or give these credentials directly now. Temporary PINs are not stored or shown again after you leave this page.</p></div><button type="button" onClick={printCards} className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-300"><Printer className="h-4 w-4" /> Print cards</button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{credentials.filter((credential) => credential.pin !== '****').map((credential) => <article key={`${credential.athlete_id}-${credential.pin}`} className="break-inside-avoid rounded-xl border border-amber-300 bg-white p-4 text-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">MathAthlone classroom access</p><p className="mt-3 text-lg font-bold">{credential.display_name}</p><dl className="mt-3 space-y-1 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Username</dt><dd className="font-mono font-semibold">{credential.username}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Temporary PIN</dt><dd className="font-mono text-lg font-bold">{credential.pin}</dd></div></dl><p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">Open the teacher&apos;s Heat link, then sign in with this username and PIN. Keep this card private.</p></article>)}</div></section>}
    </section>
  );
}

function Notice({ tone, text }: { tone: 'error' | 'success'; text: string }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  const className = tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return <div className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${className}`}><Icon className="mt-0.5 h-4 w-4 shrink-0" /><p>{text}</p></div>;
}
