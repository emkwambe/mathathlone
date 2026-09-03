'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

type Classroom = {
  id: string;
  name: string;
  grade_level: number;
  join_code: string;
  roster_count: number;
};

type RosterStudent = {
  enrollment_id: string;
  status: 'active' | 'removed';
  enrolled_at: string;
  athlete: {
    id: string;
    display_name: string;
    managed_username: string | null;
    grade_level: number | null;
    is_active: boolean | null;
  } | null;
};

type Credential = {
  athlete_id: string;
  display_name: string;
  username: string;
  pin: string;
};

type PreviewDisposition = 'create' | 'already_active' | 'needs_existing_username' | 'removed_in_this_class' | 'duplicate_in_request' | 'invalid_name';

type RosterPreview = {
  items: Array<{ display_name: string; disposition: PreviewDisposition; detail: string }>;
  summary: Record<PreviewDisposition, number>;
  preview_token: string;
  expires_at: string;
};

function apiError(payload: unknown, fallback: string): string {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) return fallback;
  const error = (payload as { error?: unknown }).error;
  return typeof error === 'string' ? error : fallback;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function submittedNames(raw: string) {
  return raw.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

function previewSummary(preview: RosterPreview) {
  const { create, already_active: alreadyActive, needs_existing_username: existing, removed_in_this_class: removed, invalid_name: invalid, duplicate_in_request: duplicates } = preview.summary;
  const attention = existing + removed + invalid + duplicates;
  return `${create} new account${create === 1 ? '' : 's'} ready to create${alreadyActive ? `; ${alreadyActive} already active` : ''}${attention ? `; ${attention} need attention` : ''}.`;
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
  const [preview, setPreview] = useState<RosterPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [existingUsername, setExistingUsername] = useState('');
  const [addingExisting, setAddingExisting] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [updatingEnrollmentId, setUpdatingEnrollmentId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((classroom) => classroom.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );
  const activeRoster = useMemo(() => roster.filter((student) => student.status === 'active'), [roster]);
  const removedRoster = useMemo(() => roster.filter((student) => student.status === 'removed'), [roster]);

  const dismissCredentials = useCallback(() => setCredentials([]), []);

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
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not load your classes.'));
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
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not load this roster.'));
    } finally {
      setLoadingRoster(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- These effects synchronize authenticated server state on mount and zeroize class-specific credentials before loading a different class. */
  useEffect(() => { void loadClasses(); }, [loadClasses]);
  useEffect(() => {
    dismissCredentials();
    setRoster([]);
    setPreview(null);
    setRosterNames('');
    if (selectedClassId) void loadRoster(selectedClassId);
  }, [selectedClassId, loadRoster, dismissCredentials]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const createClass = async (event: FormEvent) => {
    event.preventDefault();
    setError(null); setSuccess(null); dismissCredentials();
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
      setSuccess(`${payload.classroom.name} was created. Prepare and review its roster next.`);
      await loadClasses();
      setSelectedClassId(payload.classroom.id);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not create the class.'));
    } finally {
      setCreatingClass(false);
    }
  };

  const previewImport = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedClassId) return;
    setError(null); setSuccess(null); dismissCredentials(); setPreview(null);
    const names = submittedNames(rosterNames);
    if (names.length === 0) {
      setError('Paste one privacy-safe student display name per line.');
      return;
    }
    setPreviewing(true);
    try {
      const response = await fetch(`/api/classes/${selectedClassId}/roster/import`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Could not review this roster.'));
      const nextPreview = payload as RosterPreview;
      setPreview(nextPreview);
      setSuccess(`${previewSummary(nextPreview)} Review the list below; no accounts have been created yet.`);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not review this roster.'));
    } finally {
      setPreviewing(false);
    }
  };

  const confirmImport = async () => {
    if (!selectedClassId || !preview) return;
    setError(null); setSuccess(null); dismissCredentials();
    const names = submittedNames(rosterNames);
    setImporting(true);
    try {
      const response = await fetch(`/api/classes/${selectedClassId}/roster/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names, preview_token: preview.preview_token }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Could not import the roster.'));
      const created = (payload?.created ?? []) as Credential[];
      const skipped = (payload?.skipped ?? []) as Array<unknown>;
      const alreadyActive = Number(payload?.already_active ?? 0);
      setCredentials(created);
      setRosterNames(''); setPreview(null);
      setSuccess(`${created.length} new Mathlete${created.length === 1 ? '' : 's'} added${alreadyActive ? `; ${alreadyActive} already active` : ''}${skipped.length ? `; ${skipped.length} need attention` : ''}. ${created.length ? 'Secure the one-time login cards now.' : 'No new credentials were issued.'}`);
      await loadRoster(selectedClassId);
      await loadClasses();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not import the roster.'));
    } finally {
      setImporting(false);
    }
  };

  const addExisting = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedClassId) return;
    setError(null); setSuccess(null); dismissCredentials();
    if (!existingUsername.trim()) {
      setError('Enter the existing managed Mathlete username.');
      return;
    }
    setAddingExisting(true);
    try {
      const response = await fetch(`/api/classes/${selectedClassId}/roster/add-existing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: existingUsername }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Could not add the existing Mathlete.'));
      setExistingUsername('');
      setSuccess(payload?.message ?? 'The existing Mathlete is active in this class. No credential was issued.');
      await loadRoster(selectedClassId);
      await loadClasses();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not add the existing Mathlete.'));
    } finally {
      setAddingExisting(false);
    }
  };

  const updateEnrollment = async (student: RosterStudent, action: 'remove' | 'restore') => {
    if (!selectedClassId || !student.athlete) return;
    setError(null); setSuccess(null); dismissCredentials();
    const verb = action === 'remove' ? 'remove' : 'restore';
    const confirmation = action === 'remove'
      ? `Remove ${student.athlete.display_name} from this active class roster? Their Mathlete identity is not deleted. They will not be able to join a class-bound Heat until restored.`
      : `Restore ${student.athlete.display_name} to this active class roster?`;
    if (!window.confirm(confirmation)) return;
    setUpdatingEnrollmentId(student.enrollment_id);
    try {
      const response = await fetch(`/api/classes/${selectedClassId}/roster/${student.athlete.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, `Could not ${verb} this enrollment.`));
      setSuccess(`${student.athlete.display_name} was ${action === 'remove' ? 'removed from' : 'restored to'} the active class roster.`);
      await loadRoster(selectedClassId);
      await loadClasses();
    } catch (err: unknown) {
      setError(errorMessage(err, `Could not ${verb} this enrollment.`));
    } finally {
      setUpdatingEnrollmentId(null);
    }
  };

  const resetPin = async (student: RosterStudent) => {
    if (!selectedClassId || !student.athlete?.managed_username) return;
    setError(null); setSuccess(null); dismissCredentials();
    const confirmed = window.confirm(`Create a replacement temporary PIN for ${student.athlete.display_name}? The previous PIN will stop working immediately.`);
    if (!confirmed) return;
    setResettingId(student.athlete.id);
    try {
      const response = await fetch(`/api/classes/${selectedClassId}/roster/${student.athlete.id}/reset-pin`, { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Could not reset the temporary PIN.'));
      setCredentials([{ athlete_id: payload.athlete_id, display_name: payload.display_name, username: payload.username, pin: payload.pin }]);
      setSuccess(`A replacement temporary PIN was generated for ${payload.display_name}. Secure the one-time card now.`);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not reset the temporary PIN.'));
    } finally {
      setResettingId(null);
    }
  };

  const archiveSelectedClass = async () => {
    if (!selectedClassId || !selectedClass) return;
    setError(null); setSuccess(null); dismissCredentials();
    if (!window.confirm(`Archive ${selectedClass.name}? This hides the class from normal use but does not delete its roster or results. Archiving is blocked if the class has a scheduled, lobby, or open Heat.`)) return;
    setArchiving(true);
    try {
      const response = await fetch(`/api/classes/${selectedClassId}/archive`, { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(payload, 'Could not archive this class.'));
      setSuccess(`${selectedClass.name} was archived. Its roster and past results were retained.`);
      setRoster([]); setPreview(null); setRosterNames('');
      await loadClasses();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not archive this class.'));
    } finally {
      setArchiving(false);
    }
  };

  const printCards = () => window.print();
  const copyClassCode = async () => {
    if (!selectedClass) return;
    await navigator.clipboard?.writeText(selectedClass.join_code);
    setSuccess(`Class code ${selectedClass.join_code} copied. Share it only with the intended class session.`);
  };

  return (
    <section className="space-y-6">
      <style jsx global>{`@media print { .no-print { display: none !important; } .print-cards { display: grid !important; } }`}</style>

      <div className="no-print rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Pilot classrooms</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Create a class and prepare Mathlete access</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Create each pilot class once. Review a privacy-safe roster before accounts are created, secure new cards privately, and keep class-bound Heat access tied to active enrollment.</p>
          </div>
          <button type="button" onClick={() => void loadClasses()} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>

        {error && <Notice tone="error" text={error} />}
        {success && <Notice tone="success" text={success} />}

        <form onSubmit={createClass} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-[1fr_150px_auto]">
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="Class name, e.g. Grade 7 Math — Period 2" className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500" />
          <select value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500">
            <option value="">Grade level</option>
            {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => <option key={grade} value={grade}>Grade {grade}</option>)}
          </select>
          <button type="submit" disabled={creatingClass} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{creatingClass ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create class</button>
        </form>
      </div>

      <div className="no-print grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Users className="h-4 w-4 text-indigo-600" /> My classes</h3>
          {loadingClasses ? <p className="mt-4 text-sm text-slate-500">Loading classes…</p> : classes.length === 0 ? <p className="mt-4 text-sm leading-6 text-slate-500">Create your first pilot class above. Each teacher should create only the classes they teach.</p> : <div className="mt-3 space-y-2">{classes.map((classroom) => <button type="button" key={classroom.id} onClick={() => setSelectedClassId(classroom.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedClassId === classroom.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}><p className="font-semibold text-slate-900">{classroom.name}</p><p className="mt-1 text-xs text-slate-500">Grade {classroom.grade_level} · {classroom.roster_count} active</p></button>)}</div>}
        </aside>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {!selectedClass ? <div className="py-10 text-center text-sm text-slate-500">Select a class to view its roster and prepare student login cards.</div> : <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
              <div><h3 className="text-lg font-bold text-slate-900">{selectedClass.name}</h3><p className="mt-1 text-sm text-slate-600">Grade {selectedClass.grade_level} · Class code <span className="font-mono font-semibold text-slate-800">{selectedClass.join_code}</span></p></div>
              <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void copyClassCode()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" /> Copy class code</button><button type="button" onClick={() => void archiveSelectedClass()} disabled={archiving} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50">{archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />} Archive class</button></div>
            </div>

            <form onSubmit={previewImport} className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" /><div><label className="text-sm font-semibold text-slate-800">Prepare a roster import</label><p className="mt-1 text-xs leading-5 text-slate-500">Paste one privacy-safe display name per line. Review the outcome before any account is created. New temporary PINs appear only after you confirm and are never stored in the roster.</p></div></div>
              <textarea value={rosterNames} onChange={(event) => { setRosterNames(event.target.value); setPreview(null); }} rows={6} placeholder={'Avery P.\nCameron R.\nJordan S.'} className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500" />
              <button type="submit" disabled={previewing || importing} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Review roster before creating accounts</button>
            </form>

            {preview && <section className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold text-indigo-950">Roster review</h4><p className="mt-1 text-sm text-indigo-900">{previewSummary(preview)} No accounts have been created. This review expires at {new Date(preview.expires_at).toLocaleTimeString()}.</p></div><button type="button" onClick={() => void confirmImport()} disabled={importing || preview.summary.create === 0} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50">{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Confirm and issue {preview.summary.create} card{preview.summary.create === 1 ? '' : 's'}</button></div><div className="mt-4 divide-y divide-indigo-100 rounded-lg border border-indigo-100 bg-white">{preview.items.map((item, index) => <div key={`${item.display_name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"><span className="font-medium text-slate-800">{item.display_name}</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.disposition === 'create' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.disposition === 'create' ? 'New account' : item.disposition.replaceAll('_', ' ')}</span><span className="basis-full text-xs text-slate-500 sm:basis-auto">{item.detail}</span></div>)}</div></section>}

            <form onSubmit={addExisting} className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-end"><div className="flex-1"><label className="text-sm font-semibold text-slate-800">Add an existing managed Mathlete</label><p className="mt-1 text-xs leading-5 text-slate-500">Use only a teacher-issued managed username from the same school. No PIN is revealed or reset by this action.</p><input value={existingUsername} onChange={(event) => setExistingUsername(event.target.value)} placeholder="Managed username" autoCapitalize="none" autoCorrect="off" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500" /></div><button type="submit" disabled={addingExisting} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">{addingExisting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add existing</button></form>

            <RosterSection title={`Active roster (${activeRoster.length})`} empty="No Mathletes are active in this class yet. Review and confirm a roster import before starting a classroom Heat." loading={loadingRoster} students={activeRoster} action="remove" onEnrollmentChange={updateEnrollment} resettingId={resettingId} onResetPin={resetPin} updatingEnrollmentId={updatingEnrollmentId} />
            {removedRoster.length > 0 && <RosterSection title={`Removed roster (${removedRoster.length})`} empty="" loading={loadingRoster} students={removedRoster} action="restore" onEnrollmentChange={updateEnrollment} resettingId={resettingId} onResetPin={resetPin} updatingEnrollmentId={updatingEnrollmentId} />}
          </>}
        </div>
      </div>

      {credentials.length > 0 && <section className="print-cards rounded-2xl border border-amber-300 bg-amber-50 p-6"><div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-amber-950">One-time Mathlete login cards</h3><p className="mt-1 text-sm text-amber-800">Print or give these credentials directly now. When you dismiss this panel or leave the page, the temporary PINs are not shown again.</p></div><div className="flex gap-2"><button type="button" onClick={printCards} className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-300"><Printer className="h-4 w-4" /> Print cards</button><button type="button" onClick={dismissCredentials} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-100"><X className="h-4 w-4" /> I secured the cards</button></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{credentials.map((credential) => <article key={`${credential.athlete_id}-${credential.pin}`} className="break-inside-avoid rounded-xl border border-amber-300 bg-white p-4 text-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">MathAthlone classroom access</p><p className="mt-3 text-lg font-bold">{credential.display_name}</p><dl className="mt-3 space-y-1 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Username</dt><dd className="font-mono font-semibold">{credential.username}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Temporary PIN</dt><dd className="font-mono text-lg font-bold">{credential.pin}</dd></div></dl><p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">Use the teacher&apos;s Heat link or code, then sign in with this username and PIN. Keep this card private.</p></article>)}</div></section>}
    </section>
  );
}

function RosterSection({ title, empty, loading, students, action, onEnrollmentChange, resettingId, onResetPin, updatingEnrollmentId }: {
  title: string;
  empty: string;
  loading: boolean;
  students: RosterStudent[];
  action: 'remove' | 'restore';
  onEnrollmentChange: (student: RosterStudent, action: 'remove' | 'restore') => Promise<void>;
  resettingId: string | null;
  onResetPin: (student: RosterStudent) => Promise<void>;
  updatingEnrollmentId: string | null;
}) {
  return <div className="mt-6 border-t border-slate-100 pt-5"><h4 className="font-semibold text-slate-900">{title}</h4>{loading ? <p className="mt-3 text-sm text-slate-500">Loading roster…</p> : students.length === 0 ? (empty ? <p className="mt-3 text-sm text-slate-500">{empty}</p> : null) : <div className="mt-3 divide-y divide-slate-100">{students.map((student) => <div key={student.enrollment_id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium text-slate-800">{student.athlete?.display_name ?? 'Unknown Mathlete'}</p><p className="text-xs text-slate-500">{student.athlete?.managed_username ? `Managed login: ${student.athlete.managed_username}` : 'Existing Mathlete account'}{student.athlete?.grade_level ? ` · Grade ${student.athlete.grade_level}` : ''}</p></div><div className="flex flex-wrap gap-2">{action === 'remove' && student.athlete?.managed_username && <button type="button" disabled={resettingId === student.athlete.id} onClick={() => void onResetPin(student)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50">{resettingId === student.athlete.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />} Reset PIN</button>}<button type="button" disabled={updatingEnrollmentId === student.enrollment_id} onClick={() => void onEnrollmentChange(student, action)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${action === 'remove' ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{updatingEnrollmentId === student.enrollment_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : action === 'remove' ? <UserMinus className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}{action === 'remove' ? 'Remove from class' : 'Restore to class'}</button></div></div>)}</div>}</div>;
}

function Notice({ tone, text }: { tone: 'error' | 'success'; text: string }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  const className = tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return <div className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${className}`}><Icon className="mt-0.5 h-4 w-4 shrink-0" /><p>{text}</p></div>;
}
