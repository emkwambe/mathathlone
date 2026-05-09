// =============================================================================
// MathAthlone Teacher Attestation & Qualification Review
// =============================================================================
// src/components/competition/attestation.tsx
// =============================================================================

'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Flag,
  ChevronRight,
  FileText,
  Award,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface QualificationReview {
  id: string;
  athlete_id: string;
  athlete_name: string;
  school_name?: string;
  from_level: string;
  to_level: string;
  qualifying_rank: number;
  total_heats_completed: number;
  average_cta_score: number;
  best_cta_score: number;
  total_violations: number;
  has_violations: boolean;
  has_anomalies: boolean;
  review_checklist: {
    competition_history_verified: boolean;
    focus_mode_compliance: boolean;
    anomaly_check_passed: boolean;
    in_person_verification_completed: boolean;
    academic_standing_verified: boolean;
  };
  status: 'pending_review' | 'under_review' | 'approved' | 'denied' | 'requires_verification_heat' | 'disqualified';
}

interface AttestationFormProps {
  heatId: string;
  heatCode: string;
  integrityLevel: string;
  onComplete: () => void;
}

// -----------------------------------------------------------------------------
// Teacher Attestation Form
// -----------------------------------------------------------------------------

export function TeacherAttestationForm({
  heatId,
  heatCode,
  integrityLevel,
  onComplete,
}: AttestationFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [attestation, setAttestation] = useState({
    supervised: false,
    verified_identities: false,
    no_external_resources: false,
    results_accurate: false,
  });

  const allChecked = Object.values(attestation).every(Boolean);

  async function handleSubmit() {
    if (!allChecked) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, email, school_id')
        .eq('id', user.id)
        .single();

      // Create attestation text
      const attestationText = `
I, ${profile?.full_name || user.email}, hereby attest that:
1. I personally supervised Heat ${heatCode} from start to finish.
2. I verified the identity of all participating students.
3. No student used external resources or unauthorized assistance.
4. The results accurately reflect each student's mathematical ability.

Heat ID: ${heatId}
Integrity Level: ${integrityLevel}
Date: ${new Date().toISOString()}
      `.trim();

      // Create signature hash
      const encoder = new TextEncoder();
      const data = encoder.encode(attestationText + user.id + Date.now());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signatureHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Insert attestation
      const { error: insertError } = await supabase
        .from('teacher_attestations')
        .insert({
          attestation_type: 'supervision',
          heat_id: heatId,
          teacher_id: user.id,
          teacher_name: profile?.full_name || 'Unknown',
          teacher_email: user.email,
          school_id: profile?.school_id,
          attestation_text: attestationText,
          signature_hash: signatureHash,
          ip_address: null, // Would be captured server-side
          user_agent: navigator.userAgent,
        });

      if (insertError) throw insertError;

      // Update heat with attestation
      await supabase
        .from('heats')
        .update({ requires_attestation: false })
        .eq('id', heatId);

      onComplete();
    } catch (err) {
      console.error('Attestation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit attestation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Teacher Attestation</h2>
            <p className="text-indigo-200 text-sm">Required for {integrityLevel} level</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-600 mb-6">
          As the supervising teacher, you must attest that this competition was conducted fairly.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Checkboxes */}
        <div className="space-y-4 mb-6">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={attestation.supervised}
              onChange={(e) => setAttestation(prev => ({ ...prev, supervised: e.target.checked }))}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <p className="font-medium text-gray-900">I supervised this Heat</p>
              <p className="text-sm text-gray-500">I was physically present throughout the entire competition</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={attestation.verified_identities}
              onChange={(e) => setAttestation(prev => ({ ...prev, verified_identities: e.target.checked }))}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <p className="font-medium text-gray-900">I verified student identities</p>
              <p className="text-sm text-gray-500">Each student is who they claim to be</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={attestation.no_external_resources}
              onChange={(e) => setAttestation(prev => ({ ...prev, no_external_resources: e.target.checked }))}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <p className="font-medium text-gray-900">No unauthorized resources were used</p>
              <p className="text-sm text-gray-500">Students did not access notes, calculators, or external help</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={attestation.results_accurate}
              onChange={(e) => setAttestation(prev => ({ ...prev, results_accurate: e.target.checked }))}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <p className="font-medium text-gray-900">Results accurately reflect ability</p>
              <p className="text-sm text-gray-500">I believe each student's score represents their true skill</p>
            </div>
          </label>
        </div>

        {/* Legal notice */}
        <div className="p-4 bg-amber-50 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              This attestation creates a legal record. False attestations may result in 
              disqualification of students and removal from the MathAthlone program.
            </p>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!allChecked || loading}
          className={`
            w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
            ${allChecked && !loading
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
          `}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Sign & Submit Attestation
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Qualification Review Card
// -----------------------------------------------------------------------------

interface QualificationReviewCardProps {
  review: QualificationReview;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onRequestVerification: (id: string) => void;
}

export function QualificationReviewCard({
  review,
  onApprove,
  onDeny,
  onRequestVerification,
}: QualificationReviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    pending_review: 'bg-amber-100 text-amber-700',
    under_review: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    denied: 'bg-red-100 text-red-700',
    requires_verification_heat: 'bg-purple-100 text-purple-700',
    disqualified: 'bg-gray-100 text-gray-700',
  };

  const statusLabels = {
    pending_review: 'Pending Review',
    under_review: 'Under Review',
    approved: 'Approved',
    denied: 'Denied',
    requires_verification_heat: 'Needs Verification Heat',
    disqualified: 'Disqualified',
  };

  const checklist = review.review_checklist;
  const checklistItems = [
    { key: 'competition_history_verified', label: 'Competition history verified', checked: checklist.competition_history_verified },
    { key: 'focus_mode_compliance', label: 'Focus Mode compliance', checked: checklist.focus_mode_compliance },
    { key: 'anomaly_check_passed', label: 'Anomaly check passed', checked: checklist.anomaly_check_passed },
    { key: 'in_person_verification_completed', label: 'In-person verification completed', checked: checklist.in_person_verification_completed },
    { key: 'academic_standing_verified', label: 'Academic standing verified', checked: checklist.academic_standing_verified },
  ];

  return (
    <div className={`
      bg-white rounded-xl border overflow-hidden
      ${review.has_violations || review.has_anomalies 
        ? 'border-amber-200' 
        : 'border-gray-200'}
    `}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {review.athlete_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{review.athlete_name}</h3>
              <p className="text-sm text-gray-500">
                Rank #{review.qualifying_rank} • {review.total_heats_completed} Heats
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Flags */}
            {review.has_violations && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded text-amber-700 text-xs font-medium">
                <Flag className="w-3 h-3" />
                Violations
              </div>
            )}
            {review.has_anomalies && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded text-purple-700 text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                Anomalies
              </div>
            )}

            {/* Status */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[review.status]}`}>
              {statusLabels[review.status]}
            </span>

            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 p-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{review.average_cta_score.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Avg. CTA</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{review.best_cta_score.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Best CTA</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{review.total_heats_completed}</p>
              <p className="text-xs text-gray-500">Heats</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className={`text-2xl font-bold ${review.total_violations > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {review.total_violations}
              </p>
              <p className="text-xs text-gray-500">Violations</p>
            </div>
          </div>

          {/* Advancement path */}
          <div className="flex items-center justify-center gap-4 mb-6 p-3 bg-indigo-50 rounded-lg">
            <span className="font-medium text-indigo-700 capitalize">{review.from_level}</span>
            <ChevronRight className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-indigo-900 capitalize">{review.to_level}</span>
          </div>

          {/* Checklist */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Review Checklist</h4>
            <div className="space-y-2">
              {checklistItems.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  {item.checked ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300" />
                  )}
                  <span className={item.checked ? 'text-gray-900' : 'text-gray-400'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {review.status === 'pending_review' && (
            <div className="flex gap-3">
              <button
                onClick={() => onRequestVerification(review.id)}
                className="flex-1 py-2.5 px-4 border border-purple-300 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Request Verification Heat
              </button>
              <button
                onClick={() => onDeny(review.id)}
                className="flex-1 py-2.5 px-4 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Deny
              </button>
              <button
                onClick={() => onApprove(review.id)}
                className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Qualification Gate Page Component
// -----------------------------------------------------------------------------

interface QualificationGateProps {
  leagueId: string;
  fromLevel: string;
  toLevel: string;
}

export function QualificationGate({ leagueId, fromLevel, toLevel }: QualificationGateProps) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<QualificationReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reviews on mount
  React.useEffect(() => {
    async function loadReviews() {
      const { data, error } = await supabase
        .from('qualification_reviews')
        .select('*')
        .eq('league_id', leagueId)
        .eq('from_level', fromLevel)
        .eq('to_level', toLevel)
        .order('qualifying_rank');

      if (!error && data) {
        setReviews(data);
      }
      setLoading(false);
    }

    loadReviews();
  }, [supabase, leagueId, fromLevel, toLevel]);

  async function handleApprove(id: string) {
    const { error } = await supabase
      .from('qualification_reviews')
      .update({ 
        status: 'approved',
        decision_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) {
      setReviews(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'approved' } : r
      ));
    }
  }

  async function handleDeny(id: string) {
    const { error } = await supabase
      .from('qualification_reviews')
      .update({ 
        status: 'denied',
        decision_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) {
      setReviews(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'denied' } : r
      ));
    }
  }

  async function handleRequestVerification(id: string) {
    const { error } = await supabase
      .from('qualification_reviews')
      .update({ 
        status: 'requires_verification_heat',
      })
      .eq('id', id);

    if (!error) {
      setReviews(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'requires_verification_heat' } : r
      ));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const pending = reviews.filter(r => r.status === 'pending_review');
  const approved = reviews.filter(r => r.status === 'approved');
  const other = reviews.filter(r => !['pending_review', 'approved'].includes(r.status));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Qualification Gate</h2>
          <p className="text-gray-600">
            Review students advancing from {fromLevel} to {toLevel}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{approved.length}</p>
          </div>
        </div>
      </div>

      {/* Pending reviews */}
      {pending.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Review ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map(review => (
              <QualificationReviewCard
                key={review.id}
                review={review}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onRequestVerification={handleRequestVerification}
              />
            ))}
          </div>
        </section>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-500" />
            Approved ({approved.length})
          </h3>
          <div className="space-y-3">
            {approved.map(review => (
              <QualificationReviewCard
                key={review.id}
                review={review}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onRequestVerification={handleRequestVerification}
              />
            ))}
          </div>
        </section>
      )}

      {/* Other statuses */}
      {other.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Other ({other.length})
          </h3>
          <div className="space-y-3">
            {other.map(review => (
              <QualificationReviewCard
                key={review.id}
                review={review}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onRequestVerification={handleRequestVerification}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {reviews.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Qualifiers Yet</h3>
          <p className="text-gray-500">
            Students will appear here once they qualify for advancement.
          </p>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Export
// -----------------------------------------------------------------------------

export default {
  TeacherAttestationForm,
  QualificationReviewCard,
  QualificationGate,
};
