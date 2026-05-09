import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold tracking-tight">
              Math<span className="text-amber-400">Athlone</span>
            </h1>
            <p className="mt-2 text-xl text-blue-200">
              The Global Math Olympics
            </p>
          </div>

          {/* Tagline */}
          <div className="mb-12">
            <p className="text-2xl font-light mb-4">
              Where Mathletes Compete Worldwide
            </p>
            <div className="flex items-center justify-center gap-4 text-lg">
              <span className="px-3 py-1 bg-white/20 rounded-full">Content</span>
              <span className="text-amber-400">×</span>
              <span className="px-3 py-1 bg-white/20 rounded-full">Time</span>
              <span className="text-amber-400">×</span>
              <span className="px-3 py-1 bg-white/20 rounded-full">Accuracy</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register?role=athlete"
              className="w-full sm:w-auto px-8 py-4 bg-amber-400 text-amber-900 font-bold rounded-xl hover:bg-amber-300 transition-colors shadow-lg"
            >
              Join as Mathlete
            </Link>
            <Link
              href="/auth/register?role=teacher"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/30"
            >
              I&apos;m a Teacher
            </Link>
          </div>

          {/* Already have account */}
          <p className="mt-8 text-blue-200">
            Already competing?{' '}
            <Link href="/auth/login" className="text-white underline hover:no-underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How MathAthlone Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏁</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Join a Heat</h3>
              <p className="text-gray-600">
                Compete in 15-minute Heats against mathletes worldwide. 
                Enter your teacher&apos;s code or join the global queue.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🧮</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Solve Problems</h3>
              <p className="text-gray-600">
                20 questions, increasing difficulty. No calculators. 
                Just your mind, your preparation, and the clock.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏅</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Win Medals</h3>
              <p className="text-gray-600">
                Top 1% earns Gold, Top 5% Silver, Top 10% Bronze. 
                Climb the global rankings and represent your school.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Formula Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            The CTA Score Formula
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8 inline-block">
            <p className="text-xl font-mono text-gray-700">
              CTA = (Content × 0.5) + (Time × 0.3) + (Accuracy × 0.2)
            </p>
          </div>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto">
            <strong>Content</strong> rewards harder problems. 
            <strong> Time</strong> rewards speed on correct answers. 
            <strong> Accuracy</strong> rewards first-attempt success.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-lg font-semibold text-white mb-2">
            MathAthlone
          </p>
          <p className="text-sm">
            Built by Mpingo Systems • Compete with Integrity
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <Link href="/fair-play" className="hover:text-white">
              Fair Play Code
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
