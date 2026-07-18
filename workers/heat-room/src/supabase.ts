// =============================================================================
// supabase.ts — Lightweight Supabase REST client for Cloudflare Workers
// =============================================================================
// Cloudflare Workers cannot use the full @supabase/supabase-js client because
// it depends on Node.js APIs. We use the Supabase REST API directly via fetch.
// =============================================================================

export interface SupabaseClient {
  from: (table: string) => QueryBuilder;
}

interface QueryBuilder {
  select: (columns?: string) => FilterBuilder;
  update: (data: Record<string, unknown>) => FilterBuilder;
  insert: (data: Record<string, unknown> | Record<string, unknown>[]) => FilterBuilder;
}

interface FilterBuilder {
  eq: (column: string, value: unknown) => FilterBuilder;
  in: (column: string, values: unknown[]) => FilterBuilder;
  select: (columns?: string) => FilterBuilder;
  single: () => Promise<{ data: unknown; error: SupabaseError | null }>;
  execute: () => Promise<{ data: unknown[]; error: SupabaseError | null }>;
}

export interface SupabaseError {
  message: string;
  code?: string;
}

export function createSupabaseClient(url: string, serviceRoleKey: string): SupabaseClient {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Prefer': 'return=representation',
  };

  function buildFilterBuilder(
    table: string,
    method: 'GET' | 'POST' | 'PATCH',
    body?: Record<string, unknown> | Record<string, unknown>[],
    filters: string[] = [],
    selectCols = '*'
  ): FilterBuilder {
    const builder: FilterBuilder = {
      eq(column, value) {
        filters.push(`${column}=eq.${encodeURIComponent(String(value))}`);
        return builder;
      },
      in(column, values) {
        filters.push(`${column}=in.(${values.map(v => encodeURIComponent(String(v))).join(',')})`);
        return builder;
      },
      select(columns = '*') {
        selectCols = columns;
        return builder;
      },
      async single() {
        const result = await builder.execute();
        if (result.error) return { data: null, error: result.error };
        const arr = result.data as unknown[];
        return { data: arr[0] ?? null, error: null };
      },
      async execute() {
        let endpoint = `${url}/rest/v1/${table}?select=${encodeURIComponent(selectCols)}`;
        if (filters.length > 0) {
          endpoint += '&' + filters.join('&');
        }
        const fetchOptions: RequestInit = {
          method,
          headers: { ...headers },
        };
        if (body && (method === 'POST' || method === 'PATCH')) {
          (fetchOptions as RequestInit & { body: string }).body = JSON.stringify(body);
        }
        const response = await fetch(endpoint, fetchOptions);
        if (!response.ok) {
          const errBody = await response.text();
          return { data: [], error: { message: errBody, code: String(response.status) } };
        }
        const data = await response.json() as unknown[];
        return { data: Array.isArray(data) ? data : [data], error: null };
      },
    };
    return builder;
  }

  return {
    from(table) {
      return {
        select(columns = '*') {
          return buildFilterBuilder(table, 'GET', undefined, [], columns);
        },
        update(data) {
          return buildFilterBuilder(table, 'PATCH', data);
        },
        insert(data) {
          return buildFilterBuilder(table, 'POST', data);
        },
      };
    },
  };
}

// ── Domain helpers ────────────────────────────────────────────────────────────

export interface HeatRow {
  id: string;
  code: string;
  status: string;
  duration_seconds: number;
  question_count: number;
  participant_count: number;
  is_global: boolean;
  integrity_level: string;
}

export interface HeatQuestionRow {
  id: string;
  heat_id: string;
  question_text: string;
  question_latex: string | null;
  answer_type: string;
  options: string[] | null;
  correct_answer: string;
  time_limit_seconds: number;
  points_value: number;
  sequence_number: number;
}

export interface UserRow {
  id: string;
  display_name: string;
  country_code: string;
  role: string;
}

export async function fetchHeat(
  db: SupabaseClient,
  heatId: string
): Promise<HeatRow | null> {
  const { data, error } = await db
    .from('heats')
    .select('id,code,status,duration_seconds,question_count,participant_count,is_global,integrity_level')
    .eq('id', heatId)
    .single();
  if (error || !data) return null;
  return data as HeatRow;
}

export async function fetchHeatQuestions(
  db: SupabaseClient,
  heatId: string
): Promise<HeatQuestionRow[]> {
  const { data, error } = await db
    .from('heat_questions')
    .select('id,heat_id,question_text,question_latex,answer_type,options,correct_answer,time_limit_seconds,points_value,sequence_number')
    .eq('heat_id', heatId)
    .execute();
  if (error || !data) return [];
  // Sort by sequence_number ascending
  return (data as HeatQuestionRow[]).sort((a, b) => a.sequence_number - b.sequence_number);
}

export async function fetchUser(
  db: SupabaseClient,
  userId: string
): Promise<UserRow | null> {
  const { data, error } = await db
    .from('users')
    .select('id,display_name,country_code,role')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data as UserRow;
}

export async function updateHeatStatus(
  db: SupabaseClient,
  heatId: string,
  status: string,
  extra?: Record<string, unknown>
): Promise<void> {
  await db
    .from('heats')
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq('id', heatId)
    .execute();
}

export async function upsertParticipation(
  db: SupabaseClient,
  heatId: string,
  userId: string,
  data: Record<string, unknown>
): Promise<void> {
  // Try update first; if no rows affected, insert
  const { data: existing } = await db
    .from('heat_participations')
    .select('id')
    .eq('heat_id', heatId)
    .eq('athlete_id', userId)
    .single();

  if (existing) {
    await db
      .from('heat_participations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('heat_id', heatId)
      .eq('athlete_id', userId)
      .execute();
  } else {
    await db
      .from('heat_participations')
      .insert({ heat_id: heatId, athlete_id: userId, ...data })
      .execute();
  }
}

export async function insertSubmission(
  db: SupabaseClient,
  data: Record<string, unknown>
): Promise<void> {
  await db.from('question_submissions').insert(data).execute();
}
