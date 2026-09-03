import { NextRequest, NextResponse } from 'next/server';
import { resetManagedMathletePin } from '@/lib/classrooms/managed-roster';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string; athleteId: string }> };

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'The temporary PIN could not be reset.';
  if (message === 'Sign in is required.') return NextResponse.json({ error: message }, { status: 401 });
  if (/not allowed|Only this class/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
  if (/not actively enrolled/i.test(message)) return NextResponse.json({ error: message }, { status: 404 });
  if (/Only teacher-managed|inactive/i.test(message)) return NextResponse.json({ error: message }, { status: 409 });
  if (/audit is not configured|authorization is not configured/i.test(message)) return NextResponse.json({ error: message }, { status: 503 });
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Issues a replacement PIN once for an active managed Mathlete in this class. */
export async function POST(_request: NextRequest, context: RouteContext) {
  const { id: classId, athleteId } = await context.params;
  try {
    const credential = await resetManagedMathletePin(classId, athleteId);
    return NextResponse.json({
      ...credential,
      message: 'A new temporary PIN was created. Give it directly to this Mathlete and do not store it in a shared document.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
