// ============================================================
// MathAthlone Landing Page — Enhanced Edition
// src/app/page.tsx
//
// Design DNA: Energy + Friendliness + Serious Expertise
// Positioning: Math Olympiad for EVERYONE — inclusive, 
//   curriculum-based, real competitive structure
// © Mpingo Systems LLC
// ============================================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ────────────────────────────────────────────────────────────
// ANIMATED COUNTER (intersection observer)
// ────────────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let c = 0;
          const step = target / 50;
          const t = setInterval(() => {
            c += step;
            if (c >= target) { setCount(target); clearInterval(t); }
            else setCount(Math.floor(c));
          }, 30);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>;
}

// ────────────────────────────────────────────────────────────
// LIVE HEAT DEMO (interactive)
// ────────────────────────────────────────────────────────────

function LiveHeatDemo() {
  const [timeLeft, setTimeLeft] = useState(47);
  const [currentQ, setCurrentQ] = useState(1);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const questions = [
    { display: '3x + 7 = 22', a: '5' },
    { display: 'x² − 9 = 0, x > 0', a: '3' },
    { display: 'Slope of y = 4x − 1', a: '4' },
    { display: 'f(x) = 2x + 3, f(5) = ?', a: '13' },
    { display: '√144 = ?', a: '12' },
    { display: '15% of 80 = ?', a: '12' },
  ];

  const current = questions[(currentQ - 1) % questions.length];

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    const isCorrect = answer.trim() === current.a;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setScore(s => s + 100 + streak * 25);
      setStreak(s => s + 1);
    } else setStreak(0);
    setTimeout(() => {
      setFeedback(null);
      setAnswer('');
      setCurrentQ(q => q + 1);
    }, 900);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10"
         style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-amber-400">🔥 LIVE HEAT</span>
          <span className="text-xs text-white/40">NC Math 1 · Linear Equations</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/50">Q{currentQ}/20</span>
          <span className={`font-mono text-sm font-bold ${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="px-6 py-8 text-center">
        <p className="text-white/50 text-sm mb-2">Question {currentQ}</p>
        <p className="text-3xl font-semibold text-white mb-8 tracking-wide font-mono">{current.display}</p>

        <div className="flex gap-3 max-w-sm mx-auto">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Your answer..."
            className={`flex-1 px-4 py-3 rounded-xl bg-white/10 border text-white text-center text-lg font-mono
              placeholder-white/30 focus:outline-none transition-all
              ${feedback === 'correct' ? 'border-emerald-400 bg-emerald-500/20' :
                feedback === 'wrong' ? 'border-red-400 bg-red-500/20' :
                'border-white/20 focus:border-amber-400'}`}
          />
          <button onClick={handleSubmit}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold rounded-xl transition-all active:scale-95">
            →
          </button>
        </div>

        {feedback && (
          <p className={`mt-3 text-sm font-semibold ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
            {feedback === 'correct' ? `✓ Correct! +${100 + (streak - 1) * 25} pts` : `✗ The answer was ${current.a}`}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/50">Score: <span className="text-white font-bold font-mono">{score}</span></span>
          {streak > 1 && <span className="text-amber-400 font-semibold">🔥 {streak}x streak</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/40">24 mathletes competing</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MINI LEADERBOARD
// ────────────────────────────────────────────────────────────

function MiniLeaderboard() {
  const entries = [
    { name: 'Amara O.', school: 'Lincoln MS', score: 2847, medal: '🥇' },
    { name: 'Jordan C.', school: 'Westlake Prep', score: 2691, medal: '🥈' },
    { name: 'Priya S.', school: 'Oak Ridge', score: 2534, medal: '🥉' },
    { name: 'Marcus W.', school: 'Riverside', score: 2412, medal: '' },
    { name: 'Yuki T.', school: 'Hamilton', score: 2389, medal: '' },
  ];

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">District 7 Standings</span>
        <span className="flex items-center gap-1.5 text-xs text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> LIVE
        </span>
      </div>
      {entries.map((e, i) => (
        <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i < 3 ? 'bg-white/5' : ''} border-b border-white/5 last:border-0`}>
          <span className="w-6 text-center text-sm font-bold text-white/40 font-mono">{e.medal || (i + 1)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{e.name}</p>
            <p className="text-xs text-white/40">{e.school}</p>
          </div>
          <span className="text-sm font-bold text-white font-mono">{e.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// IDENTITY SHOWCASE — how names scale with competition level
// ────────────────────────────────────────────────────────────

function IdentityShowcase() {
  const levels = [
    { level: 'Classroom', tag: 'Amara', sub: null, icon: '📝', flag: null },
    { level: 'School', tag: 'Amara Osei', sub: 'Grade 8', icon: '🏫', flag: null },
    { level: 'District', tag: 'Amara Osei', sub: 'Lincoln MS', icon: '🗺️', flag: null },
    { level: 'State', tag: 'Amara Osei', sub: 'Lincoln MS, Charlotte', icon: '⭐', flag: null },
    { level: 'National', tag: 'Amara Osei', sub: 'Lincoln MS, NC', icon: '🏆', flag: '🇺🇸' },
  ];

  return (
    <div className="space-y-2">
      {levels.map((l, i) => (
        <div key={l.level}
             className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-300
               ${i === 4 ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-gray-100 bg-white'}`}>
          <span className="text-lg w-8 text-center">{l.icon}</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">{l.level}</span>
          <div className="flex items-center gap-2 flex-1">
            {/* Seed badge */}
            <span className="text-[10px] font-mono text-gray-300 w-4">1</span>
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              AO
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-gray-900">{l.tag}</span>
              {l.sub && <span className="text-xs text-gray-400 ml-2">· {l.sub}</span>}
            </div>
          </div>
          {l.flag && <span className="text-lg">{l.flag}</span>}
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MAIN LANDING PAGE
// ────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white antialiased overflow-x-hidden">
      {/* Animations */}
      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes float-delay { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.5); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .float-1 { animation: float 4s ease-in-out infinite; }
        .float-2 { animation: float-delay 5s ease-in-out infinite 0.5s; }
        .float-3 { animation: float 4.5s ease-in-out infinite 1s; }
        .glow-btn { animation: glow 2.5s ease-in-out infinite; }
        .slide-up { animation: slideUp 0.7s ease-out both; }
        .slide-up-1 { animation-delay: 0.1s; }
        .slide-up-2 { animation-delay: 0.2s; }
        .slide-up-3 { animation-delay: 0.3s; }
        .slide-up-4 { animation-delay: 0.4s; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏟️</span>
            <span className="text-xl font-bold text-gray-900 tracking-tight">MathAthlone</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#demo" className="hover:text-gray-900 transition-colors">Live demo</a>
            <a href="#leagues" className="hover:text-gray-900 transition-colors">Leagues</a>
            <a href="#educators" className="hover:text-gray-900 transition-colors">For educators</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">
              Log in
            </Link>
            <Link href="/auth/register"
                  className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition-all active:scale-95">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 40%, #6366f1 100%)' }}>
        {/* Ambient blurs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left: copy */}
            <div className="lg:col-span-3">
              <div className="slide-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm text-white/80 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                1,247 mathletes competing right now
              </div>

              <h1 className="slide-up slide-up-1 text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] mb-6">
                Where math becomes
                <br />
                <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                  a sport.
                </span>
              </h1>

              <p className="slide-up slide-up-2 text-xl text-indigo-200 mb-4 max-w-xl leading-relaxed">
                Real-time competition. ELO ratings. League brackets. Championship path from classroom to nationals.
              </p>

              <p className="slide-up slide-up-2 text-base text-indigo-300/80 mb-10 max-w-xl">
                Not just for &ldquo;math kids.&rdquo; MathAthlone is built on your school&apos;s curriculum — every student
                competes on what they&apos;re already learning. Some will discover they&apos;re ready for Math Olympiad.
                All of them will discover they can compete.
              </p>

              <div className="slide-up slide-up-3 flex flex-wrap gap-4 mb-14">
                <Link href="/auth/register"
                      className="glow-btn px-8 py-4 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold text-lg rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-400/25">
                  Start competing — it&apos;s free
                </Link>
                <a href="#demo"
                   className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-lg rounded-xl transition-all border border-white/20">
                  See it live ↓
                </a>
              </div>

              <div className="slide-up slide-up-4 flex flex-wrap gap-10">
                {[
                  { n: 699, s: '', label: 'concepts' },
                  { n: 100000, s: '+', label: 'practice questions' },
                  { n: 7, s: '', label: 'heat types' },
                  { n: 5, s: '', label: 'Divisions' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-3xl font-extrabold text-white">
                      <AnimatedNumber target={stat.n} suffix={stat.s} />
                    </p>
                    <p className="text-sm text-indigo-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: floating cards */}
            <div className="lg:col-span-2 relative hidden lg:block" style={{ minHeight: 420 }}>
              {/* Equation card */}
              <div className="float-1 absolute top-0 right-0 bg-white/95 rounded-xl p-4 shadow-2xl shadow-black/20 w-56">
                <span className="inline-block text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded mb-2">ALGEBRA</span>
                <p className="text-sm text-gray-600">Solve for x:</p>
                <p className="text-xl font-mono font-semibold text-gray-900 mt-1">3x + 7 = 22</p>
              </div>

              {/* Score card */}
              <div className="float-2 absolute top-36 right-16 bg-white/95 rounded-xl p-3.5 shadow-2xl shadow-black/20 w-52">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-indigo-950 text-xs font-bold">
                    AO
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Amara O.</p>
                    <p className="text-xs text-gray-400">+127 points</p>
                  </div>
                  <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">🥇</span>
                </div>
              </div>

              {/* Timer card */}
              <div className="float-3 absolute top-[272px] right-4 bg-white/95 rounded-xl p-3.5 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-3">
                  <span className="text-red-500 text-xl animate-pulse">⏱</span>
                  <div>
                    <p className="text-2xl font-mono font-bold text-gray-900">0:47</p>
                    <p className="text-xs text-gray-400">Time remaining</p>
                  </div>
                </div>
              </div>

              {/* Streak card */}
              <div className="float-2 absolute bottom-0 right-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-3 shadow-2xl shadow-black/20">
                <p className="text-indigo-950 text-sm font-bold">🔥 5x Streak!</p>
                <p className="text-indigo-900/60 text-xs">+125 bonus</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOT JUST FOR "MATH KIDS" ────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">Inclusive by design</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Math Olympiad is for the few.
                <br />
                <span className="text-indigo-600">MathAthlone is for everyone.</span>
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Traditional math competitions use trick questions designed for gifted students.
                MathAthlone competes on your school&apos;s actual curriculum — the same standards your teacher covers in class.
                Every student can compete. Every student can improve. And some will discover they&apos;re ready for bigger stages.
              </p>
              <div className="space-y-3">
                {[
                  'Questions based on NC/Common Core standards — not tricks',
                  'Four divisions by grade band — compete with your peers',
                  'ELO ratings track growth, not just raw scores',
                  'A natural pipeline into AMC, MATHCOUNTS, and beyond',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-600">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-5 text-center border border-gray-100">
                  <p className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Math Olympiad</p>
                  <p className="text-2xl mb-2">🧩</p>
                  <p className="text-xs text-gray-400">Trick questions</p>
                  <p className="text-xs text-gray-400">Top 2.5% qualify</p>
                  <p className="text-xs text-gray-400">Gifted programs only</p>
                  <p className="text-xs text-gray-400">Annual events</p>
                </div>
                <div className="rounded-xl bg-indigo-50 p-5 text-center border-2 border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-600 mb-3 uppercase tracking-wider">MathAthlone</p>
                  <p className="text-2xl mb-2">🏟️</p>
                  <p className="text-xs text-indigo-600 font-medium">School curriculum</p>
                  <p className="text-xs text-indigo-600 font-medium">Everyone competes</p>
                  <p className="text-xs text-indigo-600 font-medium">All classrooms</p>
                  <p className="text-xs text-indigo-600 font-medium">Year-round leagues</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-4 italic">
                Different missions, same love of math. MathAthlone doesn&apos;t replace Olympiad — it builds the pipeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">The platform</p>
            <h2 className="text-4xl font-bold text-gray-900">Everything a math league needs</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔥', title: 'Live heats', desc: 'Teacher launches a Heat, students compete in real-time. CTA scoring combines content mastery, timing, and accuracy.', accent: 'bg-amber-50' },
              { icon: '🏆', title: 'League brackets', desc: 'Swiss, round robin, single and double elimination. Auto-generated brackets with seeding, byes, and championship points.', accent: 'bg-indigo-50' },
              { icon: '📊', title: 'ELO ratings', desc: 'Glicko-2 rating system with deviation tracking and volatility. Anti-gaming detection for boosting and sandbagging.', accent: 'bg-emerald-50' },
              { icon: '🛡️', title: 'Tiered integrity', desc: 'Practice mode trusts freely. Nationals locks the browser, requires attestation, and flags anomalies automatically.', accent: 'bg-red-50' },
              { icon: '∞', title: 'Infinite questions', desc: '54 procedural generators create unlimited unique questions. No student ever sees the same problem twice.', accent: 'bg-purple-50' },
              { icon: '📈', title: 'Gap analysis', desc: 'Concept-level mastery reports mapped to NC/Common Core standards. Know exactly where each student needs help.', accent: 'bg-teal-50' },
            ].map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${f.accent}`}>{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ───────────────────────────────────── */}
      <section id="demo" className="py-24" style={{ background: 'linear-gradient(180deg, #0f0a2e 0%, #1e1b4b 100%)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-amber-400 mb-2 uppercase tracking-wider">Try it now</p>
            <h2 className="text-4xl font-bold text-white">This is what competition feels like</h2>
            <p className="text-indigo-300 mt-3">Solve the problem. Beat the clock. Climb the board.</p>
          </div>
          <div className="grid lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-3"><LiveHeatDemo /></div>
            <div className="lg:col-span-2"><MiniLeaderboard /></div>
          </div>
        </div>
      </section>

      {/* ── FOCUS MODE SHOWCASE ─────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-red-600 mb-2 uppercase tracking-wider">Competition integrity</p>
            <h2 className="text-4xl font-bold text-gray-900">Trust scales with stakes</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              Practice mode lets students explore freely. When school pride and advancement are on the line,
              Focus Mode ensures every result is earned.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="grid grid-cols-6 text-center text-xs font-semibold">
              <div className="p-3 bg-gray-50 text-gray-400">Feature</div>
              {['Practice', 'School', 'District', 'State', 'National'].map((l) => (
                <div key={l} className="p-3 bg-gray-50 text-gray-600">{l}</div>
              ))}
            </div>
            {[
              { feature: 'Focus detection', levels: [false, true, true, true, true] },
              { feature: 'Fullscreen mode', levels: [false, false, true, true, true] },
              { feature: 'Copy/paste blocked', levels: [false, false, true, true, true] },
              { feature: 'Anomaly detection', levels: [false, false, true, true, true] },
              { feature: 'Teacher attestation', levels: [false, false, false, true, true] },
              { feature: 'Lockdown browser', levels: [false, false, false, false, true] },
            ].map((row) => (
              <div key={row.feature} className="grid grid-cols-6 text-center border-t border-gray-100">
                <div className="p-3 text-sm text-gray-600 text-left">{row.feature}</div>
                {row.levels.map((on, i) => (
                  <div key={i} className="p-3 text-sm">
                    {on ? <span className="text-emerald-500">✓</span> : <span className="text-gray-200">—</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            A teacher will never send an unverified student to Districts. The system won&apos;t let them.
          </p>
        </div>
      </section>

      {/* ── DIVISIONS & LEAGUES ─────────────────────────── */}
      <section id="leagues" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">The league system</p>
            <h2 className="text-4xl font-bold text-gray-900">Find your division, climb the ranks</h2>
          </div>

          {/* Divisions (official rulebook: JR / INT / ADV / JV / SV) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
            {[
              { name: 'Junior',         grades: 'Grades 3–4',   icon: '🌱', border: 'border-t-emerald-400', bg: 'bg-emerald-50', comingSoon: true  },
              { name: 'Intermediate',   grades: 'Grades 5–6',   icon: '⚡', border: 'border-t-sky-400',     bg: 'bg-sky-50',     comingSoon: true  },
              { name: 'Advanced',       grades: 'Grades 7–8',   icon: '🔥', border: 'border-t-amber-400',   bg: 'bg-amber-50',   comingSoon: false },
              { name: 'Junior Varsity', grades: 'Grades 9–10',  icon: '🚀', border: 'border-t-indigo-400',  bg: 'bg-indigo-50',  comingSoon: false },
              { name: 'Senior Varsity', grades: 'Grades 11–12', icon: '👑', border: 'border-t-rose-400',    bg: 'bg-rose-50',    comingSoon: false },
            ].map((d) => (
              <div
                key={d.name}
                className={`relative rounded-2xl border border-gray-100 ${d.border} border-t-4 p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                  d.comingSoon ? 'opacity-70' : ''
                }`}
              >
                {d.comingSoon && (
                  <span className="absolute top-2 right-2 inline-block text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-1.5 py-0.5">
                    Soon
                  </span>
                )}
                <div className={`w-14 h-14 rounded-full ${d.bg} flex items-center justify-center text-2xl mx-auto mb-3`}>
                  {d.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-base">{d.name}</h3>
                <p className="text-xs text-gray-400">{d.grades}</p>
              </div>
            ))}
          </div>

          {/* Championship path */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6 text-center">
              Championship path
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { level: 'Classroom', icon: '📝' },
                { level: 'School', icon: '🏫' },
                { level: 'District', icon: '🗺️' },
                { level: 'Regional', icon: '🌎' },
                { level: 'State', icon: '⭐' },
                { level: 'National', icon: '🏆' },
              ].map((step, i, arr) => (
                <React.Fragment key={step.level}>
                  <div className="flex flex-col items-center text-center w-20 md:w-24">
                    <span className="text-2xl mb-1">{step.icon}</span>
                    <span className="text-xs font-semibold text-gray-900">{step.level}</span>
                  </div>
                  {i < arr.length - 1 && <span className="text-gray-300 text-xl hidden sm:block">→</span>}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
              {[
                { label: 'Fall split', period: 'Aug – Nov', icon: '🍂' },
                { label: 'Winter split', period: 'Dec – Feb', icon: '❄️' },
                { label: 'Spring split', period: 'Mar – May', icon: '🌸' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white border border-gray-100 p-4">
                  <span className="text-xl">{s.icon}</span>
                  <p className="font-semibold text-gray-900 text-sm mt-1">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.period}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── IDENTITY SCALING ────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">Represent your school</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Your identity grows with the stage
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                In the classroom, you&apos;re Amara. At Districts, you carry your school&apos;s name.
                At Nationals, you represent your state. Just like real sports — the bigger the stage,
                the bigger the pride.
              </p>
              <p className="text-sm text-gray-400">
                School colors, mascots, and announcer-style introductions are built into the system.
                When your mathletes compete, they feel like athletes.
              </p>
            </div>
            <IdentityShowcase />
          </div>
        </div>
      </section>

      {/* ── FOR EDUCATORS ───────────────────────────────── */}
      <section id="educators" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">For educators</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Your quiet kids are about to surprise you
              </h2>

              <div className="space-y-6">
                {[
                  { title: '30 seconds to launch', desc: 'Pick a topic, set the difficulty, share the code. Students join on any device — Chromebooks, tablets, phones.' },
                  { title: 'Standards-mapped analytics', desc: 'Every question maps to NC/Common Core standards. See exactly which concepts each student struggles with.' },
                  { title: 'Integrity you control', desc: 'Practice trusts freely. Playoffs lock the browser. You set the level based on the stakes.' },
                  { title: 'Real engagement, not gamification theater', desc: 'ELO ratings, league standings, and school pride. Students want to practice because it matters.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-400 ml-2">Teacher dashboard</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Active mathletes', value: '142', change: '+12 this week' },
                  { label: 'Heats this month', value: '47', change: '↑ 23%' },
                  { label: 'Avg accuracy', value: '78%', change: '↑ 5pts' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-emerald-500">{stat.change}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-semibold">Concept mastery — Period 4</p>
                {[
                  { concept: 'Linear equations', pct: 92 },
                  { concept: 'Systems of equations', pct: 74 },
                  { concept: 'Quadratic factoring', pct: 61 },
                  { concept: 'Exponential growth', pct: 45 },
                ].map((row) => (
                  <div key={row.concept} className="flex items-center gap-3 mb-2.5 last:mb-0">
                    <span className="text-xs text-gray-600 w-40 truncate">{row.concept}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${row.pct >= 80 ? 'bg-emerald-500' : row.pct >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                           style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-600 w-8 text-right font-mono">{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">Pricing</p>
            <h2 className="text-4xl font-bold text-gray-900">Free for teachers. Fair for schools.</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              Start free forever. Upgrade when you outgrow it. Per-student pricing only
              kicks in when an entire school is in.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                tier: 'Free',
                price: '$0',
                cadence: 'forever',
                blurb: 'Try MathAthlone with a class or two.',
                features: ['3 classrooms', '30 Mathletes/class', 'Practice integrity level', 'NC Math 1 content'],
                cta: { label: 'Get started', href: '/auth/register' },
                style: 'plain',
              },
              {
                tier: 'Pro',
                price: '$59',
                cadence: '/year',
                blurb: 'For teachers paying with their own budget.',
                features: ['Unlimited classrooms', 'All integrity levels', 'League brackets + standings', 'CSV export & analytics'],
                cta: { label: 'Upgrade', href: '/auth/register?plan=pro' },
                style: 'highlight',
              },
              {
                tier: 'School',
                price: '$4',
                cadence: '/Mathlete/yr',
                blurb: 'Whole-school license. Min $500/year.',
                features: ['Unlimited teachers', 'School-wide leagues', 'Admin dashboard + SSO', 'Priority support'],
                cta: { label: 'Contact us', href: 'mailto:eddy@mpingosystems.com?subject=MathAthlone%20School%20License' },
                style: 'plain',
              },
              {
                tier: 'District',
                price: '$2.50',
                cadence: '/Mathlete/yr',
                blurb: 'Cross-school leagues. Min $2,500/year.',
                features: ['All schools in district', 'Cross-school brackets', 'Dedicated onboarding', 'API access'],
                cta: { label: 'Contact us', href: 'mailto:eddy@mpingosystems.com?subject=MathAthlone%20District%20License' },
                style: 'plain',
              },
            ].map((tier) => {
              const isHighlight = tier.style === 'highlight';
              return (
                <div
                  key={tier.tier}
                  className={`relative rounded-2xl border-2 bg-white p-6 flex flex-col ${
                    isHighlight
                      ? 'border-indigo-500 ring-2 ring-indigo-200 lg:-translate-y-2 shadow-xl'
                      : 'border-gray-200 hover:shadow-md transition-shadow'
                  }`}
                >
                  {isHighlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-indigo-600">
                      Recommended
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {tier.tier}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-extrabold text-gray-900">{tier.price}</span>
                    <span className="text-sm text-gray-400">{tier.cadence}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-5 min-h-[40px]">{tier.blurb}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.cta.href}
                    className={`inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                      isHighlight
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tier.cta.label}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            Title I schools get 50% off every paid tier — built into the price, no paperwork dance.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────── */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 40%, #6366f1 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map((i) => <span key={i} className="text-amber-400 text-lg">★</span>)}
          </div>

          <blockquote className="mb-12">
            <p className="text-xl md:text-2xl text-white/90 italic leading-relaxed mb-4">
              &ldquo;My students used to dread math practice. Now they ask to stay after class
              for &lsquo;one more Heat.&rsquo; The transformation is unreal.&rdquo;
            </p>
            <cite className="text-indigo-300 text-sm not-italic">
              — Middle school math teacher, Charlotte NC
            </cite>
          </blockquote>

          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to turn your classroom<br />into an arena?
          </h2>

          <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
            Free forever for individual teachers. No credit card. Set up your first Heat in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mb-12">
            <Link href="/auth/register"
                  className="glow-btn px-6 sm:px-10 py-4 sm:py-5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold text-lg sm:text-xl rounded-2xl transition-all active:scale-95 shadow-lg shadow-amber-400/25 min-h-[44px] inline-flex items-center justify-center">
              Create your free account
            </Link>
            <a href="mailto:eddy@mpingosystems.com"
               className="px-6 sm:px-10 py-4 sm:py-5 bg-white/10 hover:bg-white/20 text-white font-semibold text-lg sm:text-xl rounded-2xl transition-all border border-white/20 min-h-[44px] inline-flex items-center justify-center">
              Book a school demo
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-indigo-300">
            <span>🔒 COPPA compliant</span>
            <span>🛡️ FERPA ready</span>
            <span>📚 NC/CCSS aligned</span>
            <span>♿ WCAG accessible</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="bg-gray-950 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏟️</span>
              <span className="text-lg font-bold text-white">MathAthlone</span>
              <span className="text-gray-500 text-sm ml-2">by Mpingo Systems</span>
            </div>
            <p className="text-xs text-gray-600">
              Precision tools built to stay. © {new Date().getFullYear()} Mpingo Systems LLC
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
