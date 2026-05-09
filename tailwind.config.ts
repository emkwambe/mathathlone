import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          primary: '#2563eb',   // Blue-600
          secondary: '#7c3aed', // Violet-600
          accent: '#06b6d4',    // Cyan-500
        },
        // Medal colors
        medal: {
          gold: '#fbbf24',      // Amber-400
          silver: '#9ca3af',    // Gray-400
          bronze: '#d97706',    // Amber-600
        },
        // Depth level colors
        depth: {
          1: '#22c55e', // Green-500 (Foundation)
          2: '#3b82f6', // Blue-500 (Developing)
          3: '#a855f7', // Purple-500 (Proficient)
          4: '#ef4444', // Red-500 (Elite)
        },
        // Status colors
        status: {
          correct: '#22c55e',   // Green-500
          incorrect: '#ef4444', // Red-500
          warning: '#f59e0b',   // Amber-500
          info: '#3b82f6',      // Blue-500
        },
        // Pace indicator colors
        pace: {
          gold: '#fbbf24',      // On track for gold
          silver: '#9ca3af',    // On track for silver
          bronze: '#d97706',    // On track for bronze
          behind: '#6b7280',    // Behind pace
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        math: ['KaTeX_Math', 'Times New Roman', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'medal-reveal': 'medalReveal 1s ease-out',
        'score-count': 'scoreCount 2s ease-out forwards',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        medalReveal: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        scoreCount: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      // Custom spacing for competition UI
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};

export default config;
