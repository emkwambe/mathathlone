'use client';

// =============================================================================
// MathAthlone — /assessment/preview
// =============================================================================
// Renders the AssessmentDocument produced by /assessment/generate. The document
// is handed over via sessionStorage (it's too large/structured to round-trip
// through a URL). Printing works via AssessmentDoc's own window.print() toolbar.
// =============================================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import AssessmentDoc from '@/components/assessment/AssessmentDoc';
import type { AssessmentDocument } from '@/lib/assessment/assembler';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRouteLoadingFallback } from '@/components/auth/ProtectedRouteLoadingFallback';

const STORAGE_KEY = 'mathathlone:assessment:doc';

export default function AssessmentPreviewPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated, hasRole } = useAuth();
  const [doc, setDoc] = useState<AssessmentDocument | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login?next=/assessment/preview');
      return;
    }
    if (!hasRole(['teacher', 'parent'])) {
      router.replace('/403');
    }
  }, [authLoading, isAuthenticated, hasRole, router]);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) setDoc(JSON.parse(raw) as AssessmentDocument);
    } catch {
      setDoc(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    // Parents may generate independent practice, but a class Heat preparation
    // document belongs only to the teacher who configured that Heat.
    if (doc?.purpose === 'competition_preparation' && !authLoading && !hasRole(['teacher'])) {
      router.replace('/403');
    }
  }, [doc, authLoading, hasRole, router]);

  if (authLoading || !isAuthenticated) {
    return <ProtectedRouteLoadingFallback loginHref="/auth/login?next=/assessment/preview" title="Loading worksheet preview" />;
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-gray-900">No assessment to preview</h1>
          <p className="mt-2 text-sm text-gray-500">
            This preview link only works right after generating a document. Head back and
            generate one.
          </p>
          <Link
            href="/assessment/generate"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Open Practice Worksheet Builder
          </Link>
        </div>
      </div>
    );
  }

  return <AssessmentDoc doc={doc} />;
}
