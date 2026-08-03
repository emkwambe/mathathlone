// =============================================================================
// POST /api/assessment/generate
// =============================================================================
// Server-side assessment assembly. Accepts concept IDs, doc type, difficulty,
// course name, and topic names. Returns the assembled AssessmentDocument JSON.
//
// Moving assembly to the server keeps the GENERATORS registry (9 000+ lines)
// out of the browser bundle, eliminating the slow initial parse on cold start.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { GENERATORS } from '@/lib/competition/generators';
import {
  assembleAssessment,
  type AssessmentType,
} from '@/lib/assessment/assembler';

// Cache the known generator keys once per server process lifetime.
const KNOWN_GENERATOR_KEYS = new Set(Object.keys(GENERATORS));

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role: teacher, parent, school_admin, or platform_admin only.
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profile as any)?.role ?? '';
    const allowed = ['teacher', 'parent', 'school_admin', 'platform_admin'];
    if (!allowed.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Parse request body ──────────────────────────────────────────────────
    const body = await req.json();
    const {
      conceptIds,
      docType,
      difficulty,
      courseName,
      topicNames,
    }: {
      conceptIds: string[];
      docType: AssessmentType;
      difficulty: number;
      courseName: string;
      topicNames: string[];
    } = body;

    if (!conceptIds?.length || !docType || !difficulty || !courseName) {
      return NextResponse.json(
        { error: 'Missing required fields: conceptIds, docType, difficulty, courseName' },
        { status: 400 }
      );
    }

    // ── Fetch active generators for the selected concepts ───────────────────
    const { data: gens, error: genErr } = await supabase
      .from('question_generators')
      .select('generator_type')
      .in('concept_id', conceptIds)
      .eq('is_active', true);

    if (genErr) {
      return NextResponse.json(
        { error: `Could not load generators: ${genErr.message}` },
        { status: 500 }
      );
    }

    // Deduplicate and filter to only implemented generator types.
    const generatorTypes = Array.from(
      new Set(
        ((gens ?? []) as Array<{ generator_type: string }>)
          .map((g) => g.generator_type)
          .filter((t) => t && KNOWN_GENERATOR_KEYS.has(t))
      )
    );

    if (generatorTypes.length === 0) {
      return NextResponse.json(
        {
          error:
            'No active question generators are available for the selected concepts. ' +
            'Try selecting more concepts or a different topic.',
        },
        { status: 422 }
      );
    }

    // ── Assemble the document (server-side, GENERATORS never leaves server) ─
    const doc = assembleAssessment(
      generatorTypes,
      [difficulty],
      docType,
      courseName,
      topicNames ?? []
    );

    return NextResponse.json({ doc }, { status: 200 });
  } catch (err: any) {
    console.error('[POST /api/assessment/generate]', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
