// Standalone, idempotent seed script for the MathAthlone NC pilot dataset.
// Talks directly to Supabase — deliberately NOT a RealityDB pack, because the
// pack engine (packages/engine) has no support for external pre-seeded FK
// pools or deterministic sequential/positional assignment, both of which
// this dataset requires. See scripts/README-mathathlone.md for the writeup.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-mathathlone-nc.ts [--dry-run]

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Seeded PRNG (mulberry32) — deterministic across runs for a fixed seed ──
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return function (): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 42;
const rng = mulberry32(SEED);

// Deterministic UUID (v4-shaped) built off the seeded RNG — same seed always
// produces the same sequence of IDs, which is what makes upsert-based
// idempotency work (re-running regenerates identical rows, not new ones).
function randomHex(length: number): string {
  let result = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < length; i++) result += chars[Math.floor(rng() * chars.length)];
  return result;
}
function deterministicUuid(): string {
  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${randomHex(4)}-${randomHex(12)}`;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function randomDateInRange(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return new Date(start + Math.floor(rng() * (end - start))).toISOString();
}

// Box-Muller transform — normal(mean=1200, stddev=80), clamped [1000, 1600].
function normalRating(): number {
  const u1 = rng() || 1e-10;
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const rating = Math.round(1200 + z * 80);
  return Math.max(1000, Math.min(1600, rating));
}

// ─── Pre-seeded external data (do NOT insert — referenced only) ────────────

const SCHOOLS = [
  { id: '33333333-0000-0000-0000-000000000001', name: 'Myers Park Middle', district: 'CMS', region: 'Charlotte Area' },
  { id: '33333333-0000-0000-0000-000000000002', name: 'Eastway Middle', district: 'CMS', region: 'Charlotte Area' },
  { id: '33333333-0000-0000-0000-000000000003', name: 'Albemarle Road Middle', district: 'CMS', region: 'Charlotte Area' },
  { id: '33333333-0000-0000-0000-000000000004', name: 'Northridge Middle', district: 'CMS', region: 'Charlotte Area' },
  { id: '33333333-0000-0000-0000-000000000005', name: 'Piedmont Middle', district: 'UCS', region: 'Charlotte Area' },
  { id: '33333333-0000-0000-0000-000000000006', name: 'Parkwood Middle', district: 'UCS', region: 'Charlotte Area' },
  { id: '33333333-0000-0000-0000-000000000007', name: 'Sun Valley Middle', district: 'UCS', region: 'Charlotte Area' },
  { id: '33333333-0000-0000-0000-000000000008', name: 'Cuthbertson Middle', district: 'UCS', region: 'Charlotte Area' },
  { id: '33333333-0000-0000-0000-000000000009', name: 'Ligon Middle', district: 'WKE', region: 'Triangle Area' },
  { id: '33333333-0000-0000-0000-000000000010', name: 'Centennial Campus Middle', district: 'WKE', region: 'Triangle Area' },
  { id: '33333333-0000-0000-0000-000000000011', name: 'East Millbrook Middle', district: 'WKE', region: 'Triangle Area' },
  { id: '33333333-0000-0000-0000-000000000012', name: 'Reedy Creek Middle', district: 'WKE', region: 'Triangle Area' },
  { id: '33333333-0000-0000-0000-000000000013', name: 'Githens Middle', district: 'DUR', region: 'Triangle Area' },
  { id: '33333333-0000-0000-0000-000000000014', name: 'Brogden Middle', district: 'DUR', region: 'Triangle Area' },
  { id: '33333333-0000-0000-0000-000000000015', name: 'Sherwood Githens Middle', district: 'DUR', region: 'Triangle Area' },
  { id: '33333333-0000-0000-0000-000000000016', name: 'Neal Middle', district: 'DUR', region: 'Triangle Area' },
] as const;

const SCHOOL_LEAGUES: Record<string, string> = {
  '33333333-0000-0000-0000-000000000001': '55555555-0000-0000-0000-000000000001',
  '33333333-0000-0000-0000-000000000002': '55555555-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000003': '55555555-0000-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000004': '55555555-0000-0000-0000-000000000004',
  '33333333-0000-0000-0000-000000000005': '55555555-0000-0000-0000-000000000005',
  '33333333-0000-0000-0000-000000000006': '55555555-0000-0000-0000-000000000006',
  '33333333-0000-0000-0000-000000000007': '55555555-0000-0000-0000-000000000007',
  '33333333-0000-0000-0000-000000000008': '55555555-0000-0000-0000-000000000008',
  '33333333-0000-0000-0000-000000000009': '55555555-0000-0000-0000-000000000009',
  '33333333-0000-0000-0000-000000000010': '55555555-0000-0000-0000-000000000010',
  '33333333-0000-0000-0000-000000000011': '55555555-0000-0000-0000-000000000011',
  '33333333-0000-0000-0000-000000000012': '55555555-0000-0000-0000-000000000012',
  '33333333-0000-0000-0000-000000000013': '55555555-0000-0000-0000-000000000013',
  '33333333-0000-0000-0000-000000000014': '55555555-0000-0000-0000-000000000014',
  '33333333-0000-0000-0000-000000000015': '55555555-0000-0000-0000-000000000015',
  '33333333-0000-0000-0000-000000000016': '55555555-0000-0000-0000-000000000016',
};

const SEASON_ID = '44444444-0000-0000-0000-000000000001';
const ADV_DIVISION_ID = 'b087107a-a33d-4c60-a36c-93e07fba9d51';

const TEACHERS = [
  'David Johnson', 'Sarah Williams', 'Marcus Brown',
  'Jennifer Davis', 'Michael Wilson', 'Angela Moore',
  'James Taylor', 'Patricia Anderson', 'Robert Thomas',
  'Keisha Jackson', 'William Harris', 'Maria Martinez',
  'Christopher Lee', 'Tamara Thompson', 'Daniel Garcia',
  'Michelle Robinson',
];

const CLASS_TEMPLATE = [
  { grade: 6, name: 'Period 1 — Grade 6 Math' },
  { grade: 6, name: 'Period 2 — Grade 6 Math' },
  { grade: 7, name: 'Period 3 — Grade 7 Math' },
  { grade: 8, name: 'Period 4 — Grade 8 Math' },
];

const DISTRICT_PREFIX: Record<string, string> = { CMS: 'CMS', UCS: 'UCS', WKE: 'WKE', DUR: 'DUR' };

// name pools — ethnic distribution 40/35/15/10
const NAME_POOLS = [
  { weight: 40, names: ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'James', 'Isabella', 'Oliver', 'Charlotte', 'Benjamin', 'Amelia', 'Elijah', 'Harper', 'Lucas'] },
  { weight: 35, names: ['Jaylen', 'Aaliyah', 'Marcus', 'Zoe', 'Darius', 'Imani', 'Jordan', 'Kayla', 'DeShawn', 'Brianna', 'Malik', 'Jasmine', 'Tre', 'Destiny', 'Xavier', 'Aliya'] },
  { weight: 15, names: ['Sofia', 'Miguel', 'Isabella', 'Carlos', 'Valentina', 'Diego', 'Camila', 'Luis', 'Gabriela', 'Mateo', 'Lucia', 'Alejandro', 'Ana', 'Roberto', 'Elena', 'Juan'] },
  { weight: 10, names: ['Aiden', 'Mei', 'Kevin', 'Priya', 'Jason', 'Yuki', 'Daniel', 'Ananya', 'Ryan', 'Sakura', 'Eric', 'Nadia', 'Justin', 'Min', 'Brandon', 'Leila'] },
];

const LAST_NAMES = [
  'Johnson', 'Williams', 'Brown', 'Davis', 'Miller',
  'Wilson', 'Moore', 'Taylor', 'Anderson', 'Jackson',
  'Harris', 'Martinez', 'Lee', 'Thompson', 'Garcia',
  'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Walker',
  'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright',
  'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker',
  'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts',
  'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans',
  'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris',
  'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy',
  'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard',
];

function pickMathleteName(): string {
  const totalWeight = NAME_POOLS.reduce((a, p) => a + p.weight, 0);
  let roll = rng() * totalWeight;
  let pool = NAME_POOLS[NAME_POOLS.length - 1];
  for (const p of NAME_POOLS) {
    roll -= p.weight;
    if (roll <= 0) { pool = p; break; }
  }
  const first = pool.names[Math.floor(rng() * pool.names.length)];
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

// ─── Row shapes ──────────────────────────────────────────────────────────

interface TeacherRow {
  id: string; email: string; role: 'teacher'; display_name: string;
  school_id: string; grade_level: null; country_code: 'US'; is_active: true;
  data_minimization_tier: 'minimal'; created_at: string; is_seed_data: true;
}
interface ClassRow {
  id: string; school_id: string; teacher_id: string; grade_level: number;
  name: string; join_code: string; is_active: true;
}
interface MathleteRow {
  id: string; email: string; role: 'athlete'; display_name: string;
  school_id: string; grade_level: number; country_code: 'US'; is_active: true;
  data_minimization_tier: 'minimal'; parent_consent_at: string; created_at: string;
  is_seed_data: true; ferpa_authorized_at: string; ferpa_authorizing_school_id: string;
}
interface EnrollmentRow {
  id: string; class_id: string; athlete_id: string; status: 'active'; enrolled_at: string;
}
interface LeagueRow {
  id: string; name: string; level: 'classroom'; region: string;
  season_id: string; max_schools: number;
  division: string; season: string; division_id: string;
  starts_at: string; ends_at: string;
}
interface AdvancementRow {
  id: string; source_league_id: string; target_league_id: string; slots_allocated: number;
}
// league_memberships tracks SCHOOLS in a league, not individual athletes —
// one row per school per classroom league (that school's own classroom league).
interface MembershipRow {
  id: string; league_id: string; school_id: string; wins: number; losses: number;
  total_points: number; rank_in_league: null; joined_at: string; is_active: true;
  heats_completed: number; avg_team_cta: null;
}
interface RatingRow {
  id: string; athlete_id: string; division_id: string; rating: number;
  rating_deviation: number; volatility: number;
  created_at: string; updated_at: string; games_played: number;
  peak_rating: number; floor_rating: number; is_provisional: true;
  last_competition: null;
}
interface StandingRow {
  id: string; league_id: string; athlete_id: string; points: number; wins: number;
  losses: number; draws: number; rank: number;
  heats_played: number; total_cta: number; avg_cta: number; best_cta: number;
  buchholz: number; buchholz_cut1: number; sonneborn_berger: number;
  first_places: number; avg_accuracy: number; avg_speed_ms: number;
  current_elo: number; elo_change: number; last_updated: string;
}

// ─── Generation ──────────────────────────────────────────────────────────

function generateAll() {
  const teachers: TeacherRow[] = [];
  const classes: ClassRow[] = [];
  const mathletes: MathleteRow[] = [];
  const enrollments: EnrollmentRow[] = [];
  const leagues: LeagueRow[] = [];
  const advancement: AdvancementRow[] = [];
  const memberships: MembershipRow[] = [];
  const ratings: RatingRow[] = [];
  const standings: StandingRow[] = [];

  // STEP 1 shape: 16 teachers, one per school, in school order.
  for (let s = 0; s < SCHOOLS.length; s++) {
    teachers.push({
      id: deterministicUuid(),
      email: `teacher${pad(s + 1, 2)}@mathathlone.edu`,
      role: 'teacher',
      display_name: TEACHERS[s],
      school_id: SCHOOLS[s].id,
      grade_level: null,
      country_code: 'US',
      is_active: true,
      data_minimization_tier: 'minimal',
      created_at: randomDateInRange('2025-08-01T00:00:00Z', '2025-09-30T23:59:59Z'),
      is_seed_data: true,
    });
  }

  // STEP 2 shape: 64 classes, 4 per school, join codes numbered per district group of 4 schools.
  for (let s = 0; s < SCHOOLS.length; s++) {
    const school = SCHOOLS[s];
    const districtIndex = s % 4; // 0-3 within each 4-school district group
    const prefix = DISTRICT_PREFIX[school.district];
    for (let c = 0; c < 4; c++) {
      const codeNum = districtIndex * 4 + c + 1;
      classes.push({
        id: deterministicUuid(),
        school_id: school.id,
        teacher_id: teachers[s].id,
        grade_level: CLASS_TEMPLATE[c].grade,
        name: CLASS_TEMPLATE[c].name,
        join_code: `${prefix}${pad(codeNum, 3)}`,
        is_active: true,
      });
    }
  }

  // STEP 3 shape: 1024 mathletes, 64 per school (in the same school order as their 4 classes).
  for (let s = 0; s < SCHOOLS.length; s++) {
    for (let i = 0; i < 64; i++) {
      const globalIndex = s * 64 + i; // 0-1023
      const classForThisAthlete = classes[s * 4 + Math.floor(i / 16)]; // 16 per class, 4 classes per school
      const createdAt = randomDateInRange('2025-08-01T00:00:00Z', '2025-09-30T23:59:59Z');
      mathletes.push({
        id: deterministicUuid(),
        email: `mathlete${pad(globalIndex + 1, 4)}@mathathlone.edu`,
        role: 'athlete',
        display_name: pickMathleteName(),
        school_id: SCHOOLS[s].id,
        grade_level: classForThisAthlete.grade_level,
        country_code: 'US',
        is_active: true,
        data_minimization_tier: 'minimal',
        parent_consent_at: createdAt,
        created_at: createdAt,
        is_seed_data: true,
        ferpa_authorized_at: createdAt,
        ferpa_authorizing_school_id: SCHOOLS[s].id,
      });
    }
  }

  // STEP 4 shape: 1024 enrollments — 16 sequential mathletes per class, in class order.
  for (let classIdx = 0; classIdx < classes.length; classIdx++) {
    const cls = classes[classIdx];
    for (let i = 0; i < 16; i++) {
      const athlete = mathletes[classIdx * 16 + i];
      enrollments.push({
        id: deterministicUuid(),
        class_id: cls.id,
        athlete_id: athlete.id,
        status: 'active',
        enrolled_at: athlete.created_at,
      });
    }
  }

  // STEP 5 shape: 64 classroom leagues, one per class.
  for (let s = 0; s < SCHOOLS.length; s++) {
    const region = SCHOOLS[s].region;
    for (let c = 0; c < 4; c++) {
      const cls = classes[s * 4 + c];
      leagues.push({
        id: deterministicUuid(),
        name: `${cls.name} League`,
        level: 'classroom',
        region,
        season_id: SEASON_ID,
        max_schools: 32,
        division: 'ADV',
        season: '2025-2026',
        division_id: ADV_DIVISION_ID,
        starts_at: '2025-08-01',
        ends_at: '2026-06-30',
      });
    }
  }

  // STEP 6 shape: 64 advancement paths, classroom league -> that school's school league.
  for (let s = 0; s < SCHOOLS.length; s++) {
    const targetLeagueId = SCHOOL_LEAGUES[SCHOOLS[s].id];
    for (let c = 0; c < 4; c++) {
      const classroomLeague = leagues[s * 4 + c];
      advancement.push({
        id: deterministicUuid(),
        source_league_id: classroomLeague.id,
        target_league_id: targetLeagueId,
        slots_allocated: 2,
      });
    }
  }

  // STEP 7 shape: 64 memberships — league_memberships tracks SCHOOLS in a
  // league, not athletes. Each of a school's 4 classroom leagues has exactly
  // one member: that same school. joined_at reuses that school's teacher's
  // created_at (the school's own onboarding date), since there's no other
  // natural date for a school-level membership row.
  for (let s = 0; s < SCHOOLS.length; s++) {
    for (let c = 0; c < 4; c++) {
      const league = leagues[s * 4 + c];
      memberships.push({
        id: deterministicUuid(),
        league_id: league.id,
        school_id: SCHOOLS[s].id,
        wins: 0,
        losses: 0,
        total_points: 0,
        rank_in_league: null,
        joined_at: teachers[s].created_at,
        is_active: true,
        heats_completed: 0,
        avg_team_cta: null,
      });
    }
  }

  // STEP 8 shape: 1024 ratings — Box-Muller normal(1200, 80), clamped [1000,1600].
  // ratingByAthleteId is kept so STEP 9's current_elo can reuse the same value.
  const ratingByAthleteId = new Map<string, number>();
  for (const athlete of mathletes) {
    const rating = normalRating();
    ratingByAthleteId.set(athlete.id, rating);
    ratings.push({
      id: deterministicUuid(),
      athlete_id: athlete.id,
      division_id: ADV_DIVISION_ID,
      rating,
      rating_deviation: 350,
      volatility: 0.06,
      created_at: athlete.created_at,
      updated_at: athlete.created_at,
      games_played: 0,
      peak_rating: rating,
      floor_rating: 800,
      is_provisional: true,
      last_competition: null,
    });
  }

  // STEP 9 shape: 1024 standings — fresh start, all zeros. rank is NOT NULL
  // (default 0), and current_elo mirrors the athlete's athlete_ratings row.
  const nowIso = new Date().toISOString();
  for (let classIdx = 0; classIdx < classes.length; classIdx++) {
    const league = leagues[classIdx];
    for (let i = 0; i < 16; i++) {
      const athlete = mathletes[classIdx * 16 + i];
      standings.push({
        id: deterministicUuid(),
        league_id: league.id,
        athlete_id: athlete.id,
        points: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        rank: 0,
        heats_played: 0,
        total_cta: 0,
        avg_cta: 0,
        best_cta: 0,
        buchholz: 0,
        buchholz_cut1: 0,
        sonneborn_berger: 0,
        first_places: 0,
        avg_accuracy: 0,
        avg_speed_ms: 0,
        current_elo: ratingByAthleteId.get(athlete.id) ?? 1200,
        elo_change: 0,
        last_updated: nowIso,
      });
    }
  }

  return { teachers, classes, mathletes, enrollments, leagues, advancement, memberships, ratings, standings };
}

// ─── Batch upsert helper — idempotent via upsert + ignoreDuplicates ───────

async function upsertInBatches<T extends { id: string }>(
  supabase: SupabaseClient,
  table: string,
  rows: T[],
  batchSize: number
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (error) {
      throw new Error(`Insert into "${table}" failed at batch starting row ${i}: ${error.message}`);
    }
  }
}

async function countRows(supabase: SupabaseClient, table: string, roleFilter?: string): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (roleFilter) query = query.eq('role', roleFilter);
  const { count, error } = await query;
  if (error) throw new Error(`Count query on "${table}" failed: ${error.message}`);
  return count ?? 0;
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const data = generateAll();

  if (dryRun) {
    console.log('=== DRY RUN — no Supabase writes will be made ===\n');
    const preview = (label: string, rows: any[]) => {
      console.log(`--- ${label} (${rows.length} rows) — first 3 ---`);
      console.log(JSON.stringify(rows.slice(0, 3), null, 2));
      console.log();
    };
    preview('teachers', data.teachers);
    preview('classes', data.classes);
    preview('mathletes', data.mathletes);
    preview('class_enrollments', data.enrollments);
    preview('leagues (classroom)', data.leagues);
    preview('league_advancement', data.advancement);
    preview('league_memberships', data.memberships);
    preview('athlete_ratings', data.ratings);
    preview('league_standings', data.standings);
    console.log('=== DRY RUN COMPLETE — nothing was written ===');
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.');
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('Seeding teachers...');
  await upsertInBatches(supabase, 'users', data.teachers, 16);
  console.log(`✅ ${data.teachers.length} teachers inserted`);

  console.log('Seeding classes...');
  await upsertInBatches(supabase, 'classes', data.classes, 64);
  console.log(`✅ ${data.classes.length} classes inserted`);

  console.log('Seeding mathletes...');
  await upsertInBatches(supabase, 'users', data.mathletes, 100);
  console.log(`✅ ${data.mathletes.length} mathletes inserted`);

  console.log('Seeding enrollments...');
  await upsertInBatches(supabase, 'class_enrollments', data.enrollments, 100);
  console.log(`✅ ${data.enrollments.length} enrollments inserted`);

  console.log('Seeding classroom leagues...');
  await upsertInBatches(supabase, 'leagues', data.leagues, 64);
  console.log(`✅ ${data.leagues.length} classroom leagues inserted`);

  console.log('Seeding league advancement...');
  await upsertInBatches(supabase, 'league_advancement', data.advancement, 64);
  console.log(`✅ ${data.advancement.length} advancement paths inserted`);

  console.log('Seeding league memberships...');
  await upsertInBatches(supabase, 'league_memberships', data.memberships, 64);
  console.log(`✅ ${data.memberships.length} school memberships inserted`);

  console.log('Seeding athlete ratings...');
  await upsertInBatches(supabase, 'athlete_ratings', data.ratings, 100);
  console.log(`✅ ${data.ratings.length} ratings inserted`);

  console.log('Seeding league standings...');
  await upsertInBatches(supabase, 'league_standings', data.standings, 100);
  console.log(`✅ ${data.standings.length} standings inserted`);

  console.log('\n=== SEED COMPLETE ===');
  const teacherCount = await countRows(supabase, 'users', 'teacher');
  const mathleteCount = await countRows(supabase, 'users', 'athlete');
  const classCount = await countRows(supabase, 'classes');
  const enrollmentCount = await countRows(supabase, 'class_enrollments');
  const leagueCount = await countRows(supabase, 'leagues');
  const advancementCount = await countRows(supabase, 'league_advancement');
  const membershipCount = await countRows(supabase, 'league_memberships');
  const ratingCount = await countRows(supabase, 'athlete_ratings');
  const standingCount = await countRows(supabase, 'league_standings');

  console.log('Teachers:', teacherCount);
  console.log('Classes:', classCount);
  console.log('Mathletes:', mathleteCount);
  console.log('Enrollments:', enrollmentCount);
  console.log('Classroom leagues:', leagueCount);
  console.log('League advancement:', advancementCount);
  console.log('League memberships:', membershipCount);
  console.log('Athlete ratings:', ratingCount);
  console.log('League standings:', standingCount);
  console.log(
    'Total rows:',
    teacherCount + mathleteCount + classCount + enrollmentCount + leagueCount + advancementCount + membershipCount + ratingCount + standingCount
  );
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
