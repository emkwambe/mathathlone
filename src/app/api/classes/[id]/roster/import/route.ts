import { NextRequest, NextResponse } from 'next/server';
import {
  commitRosterImport,
  listRoster,
  previewRosterImport,
} from '@/lib/classrooms/managed-roster';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'The roster operation could not be completed.';
  if (message === 'Sign in is required.') return NextResponse.json({ error: message }, { status: 401 });
  if (/not allowed|Only this class|not actively enrolled/i.test(message)) return NextResponse.json({ error: message }, { status: 403 });
  if (/unavailable|not enrolled/i.test(message)) return NextResponse.json({ error: message }, { status: 404 });
  if (/preview|Enter at least|limited to|privacy-safe/i.test(message)) return NextResponse.json({ error: message }, { status: 400 });
  if (/audit is not configured|authorization is not configured/i.test(message)) return NextResponse.json({ error: message }, { status: 503 });
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Preview a proposed roster without creating Auth accounts, public profiles,
 * enrollments, or credentials. A short-lived signed token is returned only to
 * confirm the exact reviewed names in the subsequent POST.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: classId } = await context.params;
  const body = await request.json().catch(() => null) as { names?: unknown } | null;
  try {
    const preview = await previewRosterImport(classId, body?.names);
    return NextResponse.json(preview, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Creates only the explicitly previewed managed Mathlete accounts, enrolls
 * them in this class, and returns temporary PINs only for newly created
 * identities. The PIN is never written to application tables or audit data.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: classId } = await context.params;
  const body = await request.json().catch(() => null) as { names?: unknown; preview_token?: unknown } | null;
  try {
    const result = await commitRosterImport(classId, body?.names, body?.preview_token);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Returns active and removed enrollment state without exposing credentials. */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: classId } = await context.params;
  try {
    const roster = await listRoster(classId, { includeRemoved: true });
    return NextResponse.json({ roster }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
