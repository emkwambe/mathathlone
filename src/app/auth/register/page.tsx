'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import type { UserRole } from '@/types';

// Country options (subset for demo)
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
];

const GRADES = [5, 6, 7, 8, 9, 10, 11, 12];

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') as 'athlete' | 'teacher' || 'athlete';

  // Form state
  const [step, setStep] = useState<'role' | 'details' | 'fairplay'>('role');
  const [role, setRole] = useState<'athlete' | 'teacher'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gradeLevel, setGradeLevel] = useState(7);
  const [classCode, setClassCode] = useState('');

  // Fair Play state
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [fairPlayAcknowledged, setFairPlayAcknowledged] = useState(false);
  const [parentConsent, setParentConsent] = useState(false);
  const fairPlayRef = useRef<HTMLDivElement>(null);

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is minor (under 18)
  const isMinor = () => {
    if (!dateOfBirth) return true;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const age = today.getFullYear() - birth.getFullYear();
    return age < 18;
  };

  // Handle Fair Play scroll detection
  const handleScroll = () => {
    if (!fairPlayRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = fairPlayRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToBottom(true);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    setError('');
    setLoading(true);

    const supabase = createSupabaseBrowser();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          role: role,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Failed to create account');
      setLoading(false);
      return;
    }

    // 2. Update profile with additional fields (trigger already created base profile)
    // Small delay to ensure trigger has completed
    await new Promise(resolve => setTimeout(resolve, 500));

    const { error: profileError } = await supabase.from('users')
      .update({
        role: role as UserRole,
        display_name: displayName,
        country_code: countryCode,
        date_of_birth: role === 'athlete' ? dateOfBirth : null,
        grade_level: role === 'athlete' ? gradeLevel : null,
        fair_play_acknowledged_at: new Date().toISOString(),
        parent_consent_at: isMinor() ? new Date().toISOString() : null,
        proctor_certified_at: role === 'teacher' ? new Date().toISOString() : null,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't block registration if profile update fails - user can update later
    }

    // 3. If class code provided, join the class
    if (classCode && role === 'athlete') {
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .eq('join_code', classCode.toUpperCase())
        .single();

      if (classData) {
        await supabase.from('class_enrollments').insert({
          class_id: classData.id,
          athlete_id: authData.user.id,
        });
      }
    }

    // Success - redirect to dashboard
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-white">
              Math<span className="text-amber-400">Athlone</span>
            </h1>
          </Link>
          <p className="text-blue-200 mt-2">Join the Global Math Olympics</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'role' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>1</div>
            <div className={`w-16 h-1 ${step !== 'role' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'details' ? 'bg-blue-600 text-white' : step === 'fairplay' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>2</div>
            <div className={`w-16 h-1 ${step === 'fairplay' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'fairplay' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>3</div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 'role' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">I am a...</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole('athlete')}
                  className={`p-6 rounded-xl border-2 transition ${
                    role === 'athlete'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">🏃</div>
                  <div className="font-semibold text-gray-900">Mathlete</div>
                  <div className="text-sm text-gray-500">I want to compete</div>
                </button>
                <button
                  onClick={() => setRole('teacher')}
                  className={`p-6 rounded-xl border-2 transition ${
                    role === 'teacher'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">👩‍🏫</div>
                  <div className="font-semibold text-gray-900">Teacher</div>
                  <div className="text-sm text-gray-500">I run competitions</div>
                </button>
              </div>
              <button
                onClick={() => setStep('details')}
                className="w-full mt-6 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === 'details' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {role === 'athlete' ? 'Mathlete Registration' : 'Teacher Registration'}
              </h2>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep('fairplay'); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder={role === 'athlete' ? 'Emma T.' : 'Mrs. Johnson'}
                  />
                  {role === 'athlete' && (
                    <p className="text-xs text-gray-500 mt-1">Use first name + last initial for privacy</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {role === 'athlete' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade Level
                      </label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        {GRADES.map((g) => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono uppercase"
                        placeholder="ABC123"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter your teacher&apos;s code to join their class</p>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('role')}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Fair Play Acknowledgment */}
          {step === 'fairplay' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Fair Play Code</h2>
              <p className="text-gray-600 mb-4 text-sm">
                Please read and acknowledge the MathAthlone Fair Play Code.
              </p>

              {/* Scrollable Fair Play Content */}
              <div
                ref={fairPlayRef}
                onScroll={handleScroll}
                className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 text-sm text-gray-700 bg-gray-50"
              >
                <h3 className="font-bold text-lg mb-3">THE MATHATHLONE PROMISE</h3>
                
                <p className="mb-3">
                  I understand that MathAthlone is a platform where Mathletes compete with integrity. 
                  My participation is a commitment to fair competition.
                </p>

                <h4 className="font-semibold mt-4 mb-2">FOR MATHLETES:</h4>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>I will compete using only my own knowledge and abilities</li>
                  <li>I will not use calculators, AI tools, or external help during Heats</li>
                  <li>I will not share questions or answers with others</li>
                  <li>I will not switch tabs, apps, or windows during competition</li>
                  <li>I will report any accidental rule violations within 10 minutes (Akeelah Rule)</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">FOR TEACHERS:</h4>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>I will maintain a fair testing environment</li>
                  <li>I will not provide hints or assistance during Heats</li>
                  <li>I will report suspected violations promptly</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">CONSEQUENCES:</h4>
                <p className="mb-2">Violations result in:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>First violation: Warning</li>
                  <li>Second violation: Accuracy score reduced by 50%</li>
                  <li>Third violation: Disqualification from Heat</li>
                  <li>Repeated violations: Account suspension</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">THE AKEELAH RULE:</h4>
                <p className="mb-4">
                  If you accidentally receive help or break a rule, you may self-report within 10 minutes. 
                  Self-reported violations void your Heat result but carry NO additional penalty and keep 
                  your integrity record clean. This rule exists because honesty is more important than any score.
                </p>

                <p className="font-semibold text-center py-4 border-t mt-4">
                  ⬇️ Scroll to the bottom to acknowledge ⬇️
                </p>
              </div>

              {/* Acknowledgment Checkboxes */}
              <div className="mt-4 space-y-3">
                <label className={`flex items-start gap-3 p-3 rounded-lg border ${hasScrolledToBottom ? 'border-gray-200 cursor-pointer hover:bg-gray-50' : 'border-gray-100 bg-gray-50 cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    checked={fairPlayAcknowledged}
                    onChange={(e) => setFairPlayAcknowledged(e.target.checked)}
                    disabled={!hasScrolledToBottom}
                    className="mt-1"
                  />
                  <span className={hasScrolledToBottom ? 'text-gray-700' : 'text-gray-400'}>
                    I have read and agree to the <strong>MathAthlone Fair Play Code</strong>
                  </span>
                </label>

                {role === 'athlete' && isMinor() && (
                  <label className={`flex items-start gap-3 p-3 rounded-lg border ${hasScrolledToBottom ? 'border-gray-200 cursor-pointer hover:bg-gray-50' : 'border-gray-100 bg-gray-50 cursor-not-allowed'}`}>
                    <input
                      type="checkbox"
                      checked={parentConsent}
                      onChange={(e) => setParentConsent(e.target.checked)}
                      disabled={!hasScrolledToBottom}
                      className="mt-1"
                    />
                    <span className={hasScrolledToBottom ? 'text-gray-700' : 'text-gray-400'}>
                      My parent/guardian consents to my participation
                    </span>
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading || !fairPlayAcknowledged || (role === 'athlete' && isMinor() && !parentConsent)}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Suspense wrapper — required because RegisterPageInner calls useSearchParams()
 * (to read ?role=teacher / ?role=athlete), which Next.js 14 production builds
 * refuse to prerender without a surrounding <Suspense> boundary.
 */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <RegisterPageInner />
    </Suspense>
  );
}
