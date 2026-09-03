import 'server-only';

import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServer } from '@/lib/supabase/server';

type AdminClient = ReturnType<typeof createAdminClient>;

type Classroom = {
  id: string;
  name: string;
  school_id: string;
  teacher_id: string;
  grade_level: number;
  is_active: boolean;
};

type ExistingAthlete = {
  id: string;
  display_name: string;
  managed_username: string | null;
  school_id: string | null;
  grade_level: number | null;
  is_active: boolean | null;
};

type Enrollment = {
  id: string;
  class_id: string;
  athlete_id: string;
  status: 'active' | 'removed';
  enrolled_at: string;
  users: ExistingAthlete | null;
};

export type PreviewDisposition =
  | 'create'
  | 'already_active'
  | 'needs_existing_username'
  | 'removed_in_this_class'
  | 'duplicate_in_request'
  | 'invalid_name';

export type RosterPreviewItem = {
  display_name: string;
  disposition: PreviewDisposition;
  detail: string;
};

export type RosterPreview = {
  items: RosterPreviewItem[];
  summary: {
    create: number;
    already_active: number;
    needs_existing_username: number;
    removed_in_this_class: number;
    invalid_name: number;
    duplicate_in_request: number;
  };
  preview_token: string;
  expires_at: string;
};

export type IssuedCredential = {
  athlete_id: string;
  display_name: string;
  username: string;
  pin: string;
};

export type ImportResult = {
  created: IssuedCredential[];
  already_active: number;
  skipped: Array<{ display_name: string; reason: string }>;
};

export type RosterEntry = {
  enrollment_id: string;
  status: 'active' | 'removed';
  enrolled_at: string;
  athlete: ExistingAthlete | null;
};

type RosterAccess = {
  admin: AdminClient;
  actorId: string;
  classroom: Classroom;
};

type SafeOperation =
  | 'preview_import'
  | 'import_created'
  | 'import_enrolled_existing'
  | 'import_already_active'
  | 'import_skipped'
  | 'enrollment_removed'
  | 'enrollment_restored'
  | 'pin_reset'
  | 'class_archived';

type SafeOutcome = 'success' | 'skipped' | 'denied' | 'failed';

const INTERNAL_EMAIL_DOMAIN = 'roster.mathathlone.internal';
const MAX_ROSTER_NAMES = 200;
const MAX_DISPLAY_NAME_LENGTH = 100;
const PREVIEW_TTL_MS = 15 * 60 * 1000;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function previewSecret(): string {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Roster preview signing is unavailable because server administration is not configured.');
  return secret;
}

function canonicalName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function nameKey(value: string): string {
  return canonicalName(value).normalize('NFKC').toLocaleLowerCase('en-US');
}

function usernameStem(displayName: string): string {
  const base = displayName
    .toLocaleLowerCase('en-US')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 14);
  return base || 'mathlete';
}

function randomPin(): string {
  return String(randomInt(100000, 1000000));
}

function digestNames(names: string[]): string {
  return createHash('sha256').update(names.map(nameKey).join('\n'), 'utf8').digest('base64url');
}

function sign(value: string): string {
  return createHmac('sha256', previewSecret()).update(value, 'utf8').digest('base64url');
}

function makePreviewToken(classId: string, actorId: string, names: string[]): { token: string; expiresAt: string } {
  const expiresAtMs = Date.now() + PREVIEW_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ classId, actorId, namesDigest: digestNames(names), expiresAtMs }), 'utf8').toString('base64url');
  return { token: `${payload}.${sign(payload)}`, expiresAt: new Date(expiresAtMs).toISOString() };
}

function verifyPreviewToken(token: unknown, classId: string, actorId: string, names: string[]) {
  if (typeof token !== 'string' || !token.includes('.')) {
    throw new Error('Review the roster and confirm the preview before creating Mathlete accounts.');
  }
  const [payload, signature, ...remainder] = token.split('.');
  if (!payload || !signature || remainder.length > 0) {
    throw new Error('The roster preview is invalid. Review it again before confirming.');
  }
  const expected = sign(payload);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
    throw new Error('The roster preview could not be verified. Review it again before confirming.');
  }

  let parsed: { classId?: unknown; actorId?: unknown; namesDigest?: unknown; expiresAtMs?: unknown };
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw new Error('The roster preview is invalid. Review it again before confirming.');
  }

  if (parsed.classId !== classId || parsed.actorId !== actorId || parsed.namesDigest !== digestNames(names)) {
    throw new Error('The roster changed after preview. Review it again before confirming.');
  }
  if (typeof parsed.expiresAtMs !== 'number' || !Number.isFinite(parsed.expiresAtMs) || parsed.expiresAtMs < Date.now()) {
    throw new Error('The roster preview expired. Review the names again before confirming.');
  }
}

function normalizeNames(raw: unknown): { valid: string[]; invalid: RosterPreviewItem[] } {
  if (!Array.isArray(raw)) return { valid: [], invalid: [] };
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: RosterPreviewItem[] = [];

  for (const value of raw) {
    if (typeof value !== 'string') {
      invalid.push({ display_name: 'Unnamed entry', disposition: 'invalid_name', detail: 'A roster entry must be a privacy-safe display name.' });
      continue;
    }
    const displayName = canonicalName(value);
    if (displayName.length < 2 || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      invalid.push({ display_name: displayName || 'Unnamed entry', disposition: 'invalid_name', detail: 'Use a privacy-safe display name between 2 and 100 characters.' });
      continue;
    }
    const key = nameKey(displayName);
    if (seen.has(key)) {
      invalid.push({ display_name: displayName, disposition: 'duplicate_in_request', detail: 'This name appears more than once in the proposed roster.' });
      continue;
    }
    seen.add(key);
    valid.push(displayName);
  }

  return { valid, invalid };
}

function joinedAthlete(value: unknown): ExistingAthlete | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || typeof candidate !== 'object') return null;
  return candidate as ExistingAthlete;
}

function initialSummary() {
  return {
    create: 0,
    already_active: 0,
    needs_existing_username: 0,
    removed_in_this_class: 0,
    invalid_name: 0,
    duplicate_in_request: 0,
  };
}

function safeReason(disposition: PreviewDisposition): string {
  switch (disposition) {
    case 'already_active': return 'This Mathlete is already active in this class.';
    case 'needs_existing_username': return 'A Mathlete with this display name already exists. Add an existing Mathlete by their managed username instead.';
    case 'removed_in_this_class': return 'This Mathlete has a removed enrollment in this class. Use Restore enrollment instead of importing the name again.';
    case 'duplicate_in_request': return 'This name appears more than once in the proposed roster.';
    case 'invalid_name': return 'Use a privacy-safe display name between 2 and 100 characters.';
    default: return 'A new managed Mathlete account will be created.';
  }
}

async function ensureAuditAvailable(admin: AdminClient) {
  const { error } = await admin.from('roster_operations').select('id').limit(1);
  if (error) throw new Error('Roster operations audit is not configured. Apply migration 051 before changing a roster.');
}

async function audit(
  admin: AdminClient,
  input: { classId: string; actorId: string; athleteId?: string; operation: SafeOperation; outcome: SafeOutcome; metadata?: Record<string, string | number | boolean | null> },
) {
  const { error } = await admin.from('roster_operations').insert({
    class_id: input.classId,
    actor_user_id: input.actorId,
    athlete_id: input.athleteId ?? null,
    operation: input.operation,
    outcome: input.outcome,
    metadata: input.metadata ?? {},
  });
  if (error) {
    console.error('[managed-roster] audit write failed', { classId: input.classId, operation: input.operation, outcome: input.outcome, code: error.code });
  }
}

export async function requireTeacherRosterOperator(classId: string): Promise<RosterAccess> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in is required.');

  const { data: canManage, error: authorizationError } = await supabase.rpc('can_manage_class', { p_class_id: classId });
  if (authorizationError) throw new Error('Class authorization is not configured. Confirm the classroom migration has run.');
  if (!canManage) throw new Error('You are not allowed to manage this class roster.');

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch (error: unknown) {
    throw new Error(errorMessage(error, 'Server administration is not configured.'));
  }

  const { data: classroom, error: classError } = await admin
    .from('classes')
    .select('id, name, school_id, teacher_id, grade_level, is_active')
    .eq('id', classId)
    .maybeSingle();
  if (classError || !classroom || !classroom.is_active) throw new Error('This class is unavailable.');
  if (classroom.teacher_id !== user.id) throw new Error('Only this class’s assigned teacher can change its roster or issue a classroom PIN.');

  return { admin, actorId: user.id, classroom: classroom as Classroom };
}

export async function requireClassRosterReader(classId: string): Promise<RosterAccess> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in is required.');
  const { data: canManage, error: authorizationError } = await supabase.rpc('can_manage_class', { p_class_id: classId });
  if (authorizationError) throw new Error('Class authorization is not configured. Confirm the classroom migration has run.');
  if (!canManage) throw new Error('You are not allowed to view this class roster.');

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch (error: unknown) {
    throw new Error(errorMessage(error, 'Server administration is not configured.'));
  }
  const { data: classroom, error: classError } = await admin
    .from('classes')
    .select('id, name, school_id, teacher_id, grade_level, is_active')
    .eq('id', classId)
    .maybeSingle();
  if (classError || !classroom || !classroom.is_active) throw new Error('This class is unavailable.');
  return { admin, actorId: user.id, classroom: classroom as Classroom };
}

async function getNameMatches(admin: AdminClient, schoolId: string, displayName: string): Promise<ExistingAthlete[]> {
  const { data, error } = await admin
    .from('users')
    .select('id, display_name, managed_username, school_id, grade_level, is_active')
    .eq('display_name', displayName)
    .eq('school_id', schoolId)
    .eq('role', 'athlete')
    .limit(2);
  if (error) throw error;
  return (data ?? []) as ExistingAthlete[];
}

async function getEnrollment(admin: AdminClient, classId: string, athleteId: string): Promise<Enrollment | null> {
  const { data, error } = await admin
    .from('class_enrollments')
    .select('id, class_id, athlete_id, status, enrolled_at, users:athlete_id(id, display_name, managed_username, school_id, grade_level, is_active)')
    .eq('class_id', classId)
    .eq('athlete_id', athleteId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Enrollment | null;
}

async function classifyName(admin: AdminClient, classroom: Classroom, displayName: string): Promise<RosterPreviewItem> {
  const matches = await getNameMatches(admin, classroom.school_id, displayName);
  if (matches.length === 0) return { display_name: displayName, disposition: 'create', detail: safeReason('create') };
  if (matches.length > 1) return { display_name: displayName, disposition: 'needs_existing_username', detail: 'More than one Mathlete at this school has this display name. Add an existing Mathlete by their managed username instead.' };

  const existing = matches[0];
  const enrollment = await getEnrollment(admin, classroom.id, existing.id);
  if (enrollment?.status === 'active') return { display_name: displayName, disposition: 'already_active', detail: safeReason('already_active') };
  if (enrollment?.status === 'removed') return { display_name: displayName, disposition: 'removed_in_this_class', detail: safeReason('removed_in_this_class') };
  return { display_name: displayName, disposition: 'needs_existing_username', detail: safeReason('needs_existing_username') };
}

async function buildPreview(access: RosterAccess, rawNames: unknown, recordAudit = true): Promise<RosterPreview> {
  const { valid, invalid } = normalizeNames(rawNames);
  if (valid.length === 0 && invalid.length === 0) throw new Error('Enter at least one privacy-safe student display name.');
  if (valid.length + invalid.length > MAX_ROSTER_NAMES) throw new Error(`A roster import is limited to ${MAX_ROSTER_NAMES} names.`);

  const items = [...invalid];
  for (const displayName of valid) items.push(await classifyName(access.admin, access.classroom, displayName));

  const summary = initialSummary();
  for (const item of items) summary[item.disposition] += 1;
  const { token, expiresAt } = makePreviewToken(access.classroom.id, access.actorId, valid);

  if (recordAudit) {
    await audit(access.admin, {
      classId: access.classroom.id,
      actorId: access.actorId,
      operation: 'preview_import',
      outcome: 'success',
      metadata: { proposed_count: items.length, create_count: summary.create, skipped_count: items.length - summary.create },
    });
  }

  return { items, summary, preview_token: token, expires_at: expiresAt };
}

export async function previewRosterImport(classId: string, rawNames: unknown): Promise<RosterPreview> {
  const access = await requireTeacherRosterOperator(classId);
  await ensureAuditAvailable(access.admin);
  return buildPreview(access, rawNames);
}

async function usernameAvailable(admin: AdminClient, candidate: string): Promise<boolean> {
  const { data, error } = await admin.from('users').select('id').ilike('managed_username', candidate).maybeSingle();
  if (error) throw error;
  return !data;
}

function usernameCandidate(displayName: string, attempt: number): string {
  const stem = usernameStem(displayName);
  if (attempt === 0) return stem;
  const suffix = randomInt(1000, 10000).toString();
  return `${stem.slice(0, Math.max(1, 20 - suffix.length))}${suffix}`;
}

async function createManagedAthlete(access: RosterAccess, displayName: string): Promise<IssuedCredential> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const username = usernameCandidate(displayName, attempt);
    if (!(await usernameAvailable(access.admin, username))) continue;

    const pin = randomPin();
    const internalEmail = `${username}@${INTERNAL_EMAIL_DOMAIN}`;
    const { data: authRecord, error: authError } = await access.admin.auth.admin.createUser({
      email: internalEmail,
      password: pin,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        desired_role: 'mathlete',
        managed_username: username,
        school_id: access.classroom.school_id,
      },
    });
    if (authError || !authRecord.user) {
      if (/already|exists|duplicate|registered/i.test(authError?.message ?? '')) continue;
      throw authError ?? new Error('Could not create the managed Mathlete account.');
    }

    const athleteId = authRecord.user.id;
    const { error: profileError } = await access.admin.from('users').upsert({
      id: athleteId,
      email: internalEmail,
      display_name: displayName,
      role: 'athlete',
      school_id: access.classroom.school_id,
      grade_level: access.classroom.grade_level,
      managed_username: username,
      country_code: 'US',
    }, { onConflict: 'id' });

    if (profileError) {
      await access.admin.auth.admin.deleteUser(athleteId).catch(() => undefined);
      if (/duplicate|unique/i.test(profileError.message)) continue;
      throw profileError;
    }

    const { error: enrollmentError } = await access.admin.from('class_enrollments').insert({
      class_id: access.classroom.id,
      athlete_id: athleteId,
      status: 'active',
    });
    if (enrollmentError) {
      await access.admin.auth.admin.deleteUser(athleteId).catch(() => undefined);
      throw enrollmentError;
    }

    await audit(access.admin, {
      classId: access.classroom.id,
      actorId: access.actorId,
      athleteId,
      operation: 'import_created',
      outcome: 'success',
      metadata: { account_type: 'managed', enrollment_status: 'active' },
    });
    return { athlete_id: athleteId, display_name: displayName, username, pin };
  }
  throw new Error(`Could not create a unique managed username for ${displayName}.`);
}

export async function commitRosterImport(classId: string, rawNames: unknown, previewToken: unknown): Promise<ImportResult> {
  const access = await requireTeacherRosterOperator(classId);
  await ensureAuditAvailable(access.admin);
  const { valid } = normalizeNames(rawNames);
  if (valid.length === 0) throw new Error('Enter at least one privacy-safe student display name.');
  if (valid.length > MAX_ROSTER_NAMES) throw new Error(`A roster import is limited to ${MAX_ROSTER_NAMES} names.`);
  verifyPreviewToken(previewToken, access.classroom.id, access.actorId, valid);
  await ensureNoMutableHeat(access);

  // Re-evaluate state at confirmation time so a name cannot be created from a
  // stale preview. This verification does not produce a second preview audit.
  const preview = await buildPreview(access, rawNames, false);
  const created: IssuedCredential[] = [];
  const skipped: Array<{ display_name: string; reason: string }> = [];
  let alreadyActive = 0;

  for (const item of preview.items) {
    if (item.disposition === 'already_active') {
      alreadyActive += 1;
      await audit(access.admin, {
        classId: access.classroom.id,
        actorId: access.actorId,
        operation: 'import_already_active',
        outcome: 'skipped',
        metadata: { reason: 'already_active' },
      });
      continue;
    }
    if (item.disposition !== 'create') {
      skipped.push({ display_name: item.display_name, reason: item.detail });
      await audit(access.admin, {
        classId: access.classroom.id,
        actorId: access.actorId,
        operation: 'import_skipped',
        outcome: 'skipped',
        metadata: { reason: item.disposition },
      });
      continue;
    }

    try {
      created.push(await createManagedAthlete(access, item.display_name));
    } catch (error: unknown) {
      skipped.push({ display_name: item.display_name, reason: errorMessage(error, 'Could not add this Mathlete.') });
      await audit(access.admin, {
        classId: access.classroom.id,
        actorId: access.actorId,
        operation: 'import_skipped',
        outcome: 'failed',
        metadata: { reason: 'account_creation_failed' },
      });
    }
  }

  return { created, already_active: alreadyActive, skipped };
}

export async function listRoster(classId: string, options: { includeRemoved?: boolean } = {}): Promise<RosterEntry[]> {
  const access = await requireClassRosterReader(classId);
  let query = access.admin
    .from('class_enrollments')
    .select('id, status, enrolled_at, users:athlete_id(id, display_name, managed_username, school_id, grade_level, is_active)')
    .eq('class_id', classId)
    .order('enrolled_at', { ascending: true });
  if (!options.includeRemoved) query = query.eq('status', 'active');
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: { id: string; status: 'active' | 'removed'; enrolled_at: string; users: unknown }) => ({
    enrollment_id: row.id,
    status: row.status,
    enrolled_at: row.enrolled_at,
    athlete: joinedAthlete(row.users),
  })) as RosterEntry[];
}

async function ensureNoMutableHeat(access: RosterAccess) {
  const { data, error } = await access.admin
    .from('heats')
    .select('id, status')
    .eq('class_id', access.classroom.id)
    .in('status', ['lobby', 'open', 'scheduled'])
    .limit(1);
  if (error) throw error;
  if ((data ?? []).length > 0) {
    throw new Error('This roster cannot change while a class Heat is scheduled, in the lobby, or open. Complete or cancel that Heat first.');
  }
}

export async function changeEnrollment(classId: string, athleteId: string, action: 'remove' | 'restore') {
  const access = await requireTeacherRosterOperator(classId);
  await ensureAuditAvailable(access.admin);
  await ensureNoMutableHeat(access);

  const enrollment = await getEnrollment(access.admin, classId, athleteId);
  if (!enrollment || !enrollment.users) throw new Error('This Mathlete is not enrolled in the selected class.');
  if (action === 'remove' && enrollment.status === 'removed') return { enrollment, changed: false };
  if (action === 'restore' && enrollment.status === 'active') return { enrollment, changed: false };
  if (action === 'restore' && enrollment.users.is_active === false) throw new Error('This Mathlete account is inactive and cannot be restored.');

  const nextStatus = action === 'remove' ? 'removed' : 'active';
  const { data: updated, error } = await access.admin
    .from('class_enrollments')
    .update({ status: nextStatus })
    .eq('id', enrollment.id)
    .select('id, status, enrolled_at, users:athlete_id(id, display_name, managed_username, school_id, grade_level, is_active)')
    .single();
  if (error) throw error;

  await audit(access.admin, {
    classId,
    actorId: access.actorId,
    athleteId,
    operation: action === 'remove' ? 'enrollment_removed' : 'enrollment_restored',
    outcome: 'success',
    metadata: { enrollment_status: nextStatus },
  });
  return { enrollment: { enrollment_id: updated.id, status: updated.status, enrolled_at: updated.enrolled_at, athlete: joinedAthlete(updated.users) } as RosterEntry, changed: true };
}

export async function addExistingManagedMathlete(classId: string, rawUsername: unknown) {
  const access = await requireTeacherRosterOperator(classId);
  await ensureAuditAvailable(access.admin);
  await ensureNoMutableHeat(access);
  const username = typeof rawUsername === 'string' ? rawUsername.trim().toLocaleLowerCase('en-US') : '';
  if (!/^[a-z0-9]{2,24}$/.test(username)) throw new Error('Enter a valid managed Mathlete username.');

  const { data: athlete, error: athleteError } = await access.admin
    .from('users')
    .select('id, display_name, managed_username, school_id, grade_level, is_active')
    .ilike('managed_username', username)
    .maybeSingle();
  if (athleteError) throw athleteError;
  if (!athlete || athlete.school_id !== access.classroom.school_id || !athlete.managed_username) {
    throw new Error('No active managed Mathlete at this school matches that username.');
  }
  if (athlete.is_active === false) throw new Error('This Mathlete account is inactive.');

  const existingEnrollment = await getEnrollment(access.admin, classId, athlete.id);
  if (existingEnrollment?.status === 'active') return { enrollment: existingEnrollment, changed: false, message: 'This Mathlete is already active in this class.' };
  if (existingEnrollment?.status === 'removed') throw new Error('This Mathlete has a removed enrollment in this class. Use Restore enrollment instead.');

  const { data: enrollment, error: enrollmentError } = await access.admin
    .from('class_enrollments')
    .insert({ class_id: classId, athlete_id: athlete.id, status: 'active' })
    .select('id, status, enrolled_at, users:athlete_id(id, display_name, managed_username, school_id, grade_level, is_active)')
    .single();
  if (enrollmentError) throw enrollmentError;
  await audit(access.admin, {
    classId,
    actorId: access.actorId,
    athleteId: athlete.id,
    operation: 'import_enrolled_existing',
    outcome: 'success',
    metadata: { account_type: 'managed', enrollment_status: 'active' },
  });
  return { enrollment: { enrollment_id: enrollment.id, status: enrollment.status, enrolled_at: enrollment.enrolled_at, athlete: joinedAthlete(enrollment.users) } as RosterEntry, changed: true, message: 'The existing Mathlete is now active in this class.' };
}

export async function resetManagedMathletePin(classId: string, athleteId: string): Promise<IssuedCredential> {
  const access = await requireTeacherRosterOperator(classId);
  await ensureAuditAvailable(access.admin);
  const enrollment = await getEnrollment(access.admin, classId, athleteId);
  const athlete = enrollment?.users;
  if (!enrollment || enrollment.status !== 'active' || !athlete) throw new Error('This Mathlete is not actively enrolled in this class.');
  if (!athlete.managed_username) throw new Error('Only teacher-managed Mathlete accounts can receive a classroom PIN reset.');
  if (athlete.is_active === false) throw new Error('This Mathlete account is inactive.');

  const pin = randomPin();
  const { error } = await access.admin.auth.admin.updateUserById(athleteId, {
    password: pin,
    user_metadata: { display_name: athlete.display_name, desired_role: 'mathlete', managed_username: athlete.managed_username, school_id: access.classroom.school_id },
  });
  if (error) throw error;

  await audit(access.admin, {
    classId,
    actorId: access.actorId,
    athleteId,
    operation: 'pin_reset',
    outcome: 'success',
    metadata: { account_type: 'managed' },
  });
  return { athlete_id: athleteId, display_name: athlete.display_name, username: athlete.managed_username, pin };
}

export async function archiveClass(classId: string) {
  const access = await requireTeacherRosterOperator(classId);
  await ensureAuditAvailable(access.admin);
  await ensureNoMutableHeat(access);
  const { error } = await access.admin.from('classes').update({ is_active: false }).eq('id', classId);
  if (error) throw error;
  await audit(access.admin, {
    classId,
    actorId: access.actorId,
    operation: 'class_archived',
    outcome: 'success',
    metadata: { active_roster_changes: 'blocked_after_archive' },
  });
}
