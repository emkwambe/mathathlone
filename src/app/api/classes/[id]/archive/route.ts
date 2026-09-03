import { NextResponse } from 'next/server';
import { archiveClass } from '@/lib/classrooms/managed-roster';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'The class could not be archived.';
  if (message === 'Sign in is required.') return NextResponse.json({ error: message }, { status: 401 });
  if (/not allowed|Only this class/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
  if (/cannot change/i.test(message)) return NextResponse.json({ error: message }, { status: 409 });
  if (/audit is not configured|authorization is not configured/i.test(message)) return NextResponse.json({ error: message }, { status: 503 });
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Soft-archives a teacher-owned class only when no mutable class Heat exists. */
export async function POST(_request: Request, context: RouteContext) {
  const { id: classId } = await context.params;
  try {
    await archiveClass(classId);
    return NextResponse.json({ archived: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
