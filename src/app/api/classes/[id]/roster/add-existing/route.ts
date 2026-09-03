import { NextRequest, NextResponse } from 'next/server';
import { addExistingManagedMathlete } from '@/lib/classrooms/managed-roster';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'The Mathlete could not be added to this class.';
  if (message === 'Sign in is required.') return NextResponse.json({ error: message }, { status: 401 });
  if (/not allowed|Only this class/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
  if (/No active managed Mathlete|inactive|removed enrollment/i.test(message)) return NextResponse.json({ error: message }, { status: 409 });
  if (/valid managed Mathlete username/i.test(message)) return NextResponse.json({ error: message }, { status: 400 });
  if (/audit is not configured|authorization is not configured/i.test(message)) return NextResponse.json({ error: message }, { status: 503 });
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Enrolls a known, same-school managed Mathlete by username. No PIN is returned. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: classId } = await context.params;
  const body = await request.json().catch(() => null) as { username?: unknown } | null;
  try {
    const result = await addExistingManagedMathlete(classId, body?.username);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
