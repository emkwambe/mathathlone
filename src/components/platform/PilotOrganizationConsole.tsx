'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, RefreshCw, ShieldCheck, UsersRound } from 'lucide-react';

type District = { id: string; name: string; state: string; is_active: boolean };
type School = {
  id: string;
  name: string;
  state: string | null;
  district_id: string | null;
  verified: boolean | null;
  is_active: boolean | null;
  districts?: { id: string; name: string } | null;
};
type StaffMember = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  school_id: string | null;
  is_active: boolean;
  schools?: { id: string; name: string; district_id: string | null } | null;
};

type LoadState = {
  districts: District[];
  schools: School[];
  staff: StaffMember[];
};

const EMPTY_STATE: LoadState = { districts: [], schools: [], staff: [] };

function schoolDistrictLabel(school: School): string {
  return school.districts?.name ?? 'No district assigned';
}

export default function PilotOrganizationConsole() {
  const [data, setData] = useState<LoadState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [districtName, setDistrictName] = useState('');
  const [districtState, setDistrictState] = useState('NC');
  const [schoolName, setSchoolName] = useState('');
  const [schoolState, setSchoolState] = useState('NC');
  const [schoolDistrictId, setSchoolDistrictId] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('teacher');
  const [staffSchoolId, setStaffSchoolId] = useState('');
  const [staffDistrictId, setStaffDistrictId] = useState('');

  const schoolsForSelectedDistrict = useMemo(
    () => data.schools.filter((school) => !staffDistrictId || school.district_id === staffDistrictId),
    [data.schools, staffDistrictId]
  );

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/platform/pilot/organizations', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to load pilot organization data.');
      setData({
        districts: payload.districts ?? [],
        schools: payload.schools ?? [],
        staff: payload.staff ?? [],
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load pilot organization data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function submit(action: string, body: Record<string, unknown>) {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/platform/pilot/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'The pilot administration action failed.');
      await refresh();
      if (payload.relogin_required) {
        setMessage('Staff assignment saved. The assigned staff member must sign out and sign back in before using the new role.');
      } else {
        setMessage('Pilot organization change saved.');
      }
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The pilot administration action failed.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function createDistrict(event: FormEvent) {
    event.preventDefault();
    const saved = await submit('create_district', { name: districtName, state: districtState });
    if (saved) setDistrictName('');
  }

  async function createSchool(event: FormEvent) {
    event.preventDefault();
    const saved = await submit('create_school', { name: schoolName, state: schoolState, district_id: schoolDistrictId });
    if (saved) setSchoolName('');
  }

  async function assignStaff(event: FormEvent) {
    event.preventDefault();
    const body: Record<string, unknown> = { email: staffEmail, role: staffRole };
    if (staffRole === 'district_admin') {
      body.district_id = staffDistrictId;
      if (staffSchoolId) body.school_id = staffSchoolId;
    } else {
      body.school_id = staffSchoolId;
    }
    const saved = await submit('assign_staff', body);
    if (saved) setStaffEmail('');
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 flex-none text-indigo-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Three-School Pilot Administration</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-indigo-100/80">
              Provision only the pilot district, its schools, and staff who already have Mathathlone accounts. School and district scope is stored server-side; this screen never creates or displays student passwords.
            </p>
          </div>
        </div>
      </section>

      {(message || error) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-500/40 bg-rose-950/30 text-rose-100' : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100'}`}>
          {error ?? message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <form onSubmit={createDistrict} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-violet-300" /><h3 className="font-semibold text-white">1. Pilot District</h3></div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">District name</label>
          <input value={districtName} onChange={(event) => setDistrictName(event.target.value)} minLength={3} required className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Example County Schools" />
          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-slate-400">State</label>
          <input value={districtState} onChange={(event) => setDistrictState(event.target.value.toUpperCase().slice(0, 2))} maxLength={2} required className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" />
          <button disabled={isSubmitting} className="mt-4 w-full rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50">Create district</button>
        </form>

        <form onSubmit={createSchool} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-emerald-300" /><h3 className="font-semibold text-white">2. Pilot School</h3></div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">School name</label>
          <input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} minLength={3} required className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Northview Middle School" />
          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-slate-400">District</label>
          <select value={schoolDistrictId} onChange={(event) => setSchoolDistrictId(event.target.value)} required className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white">
            <option value="">Select the pilot district</option>
            {data.districts.filter((district) => district.is_active).map((district) => <option key={district.id} value={district.id}>{district.name} ({district.state})</option>)}
          </select>
          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-slate-400">State</label>
          <input value={schoolState} onChange={(event) => setSchoolState(event.target.value.toUpperCase().slice(0, 2))} maxLength={2} required className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" />
          <button disabled={isSubmitting || data.districts.length === 0} className="mt-4 w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">Create school</button>
        </form>

        <form onSubmit={assignStaff} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center gap-2"><UsersRound className="h-5 w-5 text-amber-300" /><h3 className="font-semibold text-white">3. Assign Existing Staff</h3></div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">Registered email</label>
          <input type="email" value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} required className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="teacher@school.edu" />
          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-slate-400">Pilot role</label>
          <select value={staffRole} onChange={(event) => setStaffRole(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white">
            <option value="teacher">Teacher</option>
            <option value="school_admin">School Coordinator</option>
            <option value="district_admin">District Coordinator</option>
          </select>
          {staffRole === 'district_admin' ? (
            <>
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-slate-400">District</label>
              <select value={staffDistrictId} onChange={(event) => { setStaffDistrictId(event.target.value); setStaffSchoolId(''); }} required className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white">
                <option value="">Select the pilot district</option>
                {data.districts.filter((district) => district.is_active).map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
              </select>
            </>
          ) : null}
          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-slate-400">{staffRole === 'district_admin' ? 'Optional home school' : 'School'}</label>
          <select value={staffSchoolId} onChange={(event) => setStaffSchoolId(event.target.value)} required={staffRole !== 'district_admin'} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white">
            <option value="">{staffRole === 'district_admin' ? 'No home school selected' : 'Select the pilot school'}</option>
            {(staffRole === 'district_admin' ? schoolsForSelectedDistrict : data.schools).filter((school) => school.is_active !== false).map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
          </select>
          <button disabled={isSubmitting} className="mt-4 w-full rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50">Save staff assignment</button>
        </form>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold text-white">Pilot organization status</h3><p className="mt-1 text-xs text-slate-400">Each teacher must be assigned to exactly one pilot school before classroom setup begins in Sprint 16C.</p></div><button onClick={() => void refresh()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />Refresh</button></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Districts ({data.districts.length})</h4><div className="space-y-2">{data.districts.map((district) => <div key={district.id} className="rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2"><p className="text-sm font-medium text-white">{district.name}</p><p className="text-xs text-slate-400">{district.state} · {district.is_active ? 'Active' : 'Inactive'}</p></div>)}{!isLoading && data.districts.length === 0 ? <p className="text-sm text-slate-500">No pilot district has been created.</p> : null}</div></div>
          <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Schools ({data.schools.length})</h4><div className="space-y-2">{data.schools.map((school) => <div key={school.id} className="rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2"><p className="text-sm font-medium text-white">{school.name}</p><p className="text-xs text-slate-400">{schoolDistrictLabel(school)} · {school.verified ? 'Verified' : 'Pending verification'}</p></div>)}{!isLoading && data.schools.length === 0 ? <p className="text-sm text-slate-500">No pilot school has been created.</p> : null}</div></div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="font-semibold text-white">Scoped staff assignments ({data.staff.length})</h3>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400"><tr><th className="pb-3 pr-4">Staff member</th><th className="pb-3 pr-4">Role</th><th className="pb-3 pr-4">School</th><th className="pb-3">Status</th></tr></thead><tbody>{data.staff.map((member) => <tr key={member.id} className="border-b border-white/5"><td className="py-3 pr-4"><p className="font-medium text-white">{member.display_name}</p><p className="text-xs text-slate-400">{member.email}</p></td><td className="py-3 pr-4 capitalize text-slate-200">{member.role.replace('_', ' ')}</td><td className="py-3 pr-4 text-slate-300">{member.schools?.name ?? 'District/platform scope'}</td><td className="py-3 text-slate-400">{member.is_active ? 'Active' : 'Inactive'}</td></tr>)}{!isLoading && data.staff.length === 0 ? <tr><td colSpan={4} className="py-6 text-center text-slate-500">No staff records are available.</td></tr> : null}</tbody></table></div>
      </section>
    </div>
  );
}
