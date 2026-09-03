import { NextRequest, NextResponse } from 'next/server';
import { changeEnrollment } from '@/lib/classrooms/managed-roster';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string; athleteId: string }> };

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'The enrollment could not be updated.';
  if (message === 'Sign in is required.') return NextResponse.json({ error: message }, { status: 401 });
  if (/not allowed|Only this class/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
  if (/not enrolled/i.test(message)) return NextResponse.json({ error: message }, { status: 404 });
  if (/cannot change|inactive/i.test(message)) return NextResponse.json({ error: message }, { status: 409 });
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Changes only the enrollment status; it never deletes the Mathlete identity.
 * A scheduled, lobby, or open class Heat blocks this operation.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: classId, athleteId } = await context.params;
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  if (body?.action !== 'remove' && body?.action !== 'restore') {
    return NextResponse.json({ error: 'Choose either remove or restore for this enrollment.' }, { status: 400 });
  }

  try {
    const result = await changeEnrollment(classId, athleteId, body.action);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
