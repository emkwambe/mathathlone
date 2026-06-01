import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import DevAccountSwitcher from '@/components/dev/DevAccountSwitcher';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'MathAthlone',
    template: '%s | MathAthlone',
  },
  description: 'Global math competition platform. Content × Time × Accuracy.',
  keywords: ['math', 'competition', 'education', 'olympics', 'stem'],
  authors: [{ name: 'Mpingo Systems' }],
  openGraph: {
    title: 'MathAthlone',
    description: 'Global math competition platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} scroll-smooth`}>
      <body className="min-h-screen bg-gray-50 font-sans">
        <AuthProvider>
          {children}
          <DevAccountSwitcher />
        </AuthProvider>
      </body>
    </html>
  );
}
