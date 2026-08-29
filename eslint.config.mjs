import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

// This codebase predates the Next.js 16 ESLint flat configuration. The rules
// below are intentionally warnings for the first compatibility release so the
// lint command becomes usable without hiding the existing debt. A dedicated
// quality sprint should promote them back to errors after remediation.
const inheritedDebtWarnings = {
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-require-imports': 'warn',
  '@typescript-eslint/no-unsafe-function-type': 'warn',
  '@typescript-eslint/no-unused-vars': 'warn',
  'import/no-anonymous-default-export': 'warn',
  'prefer-const': 'warn',
  'react/no-unescaped-entities': 'warn',
  'react-hooks/exhaustive-deps': 'warn',
  'react-hooks/immutability': 'warn',
  'react-hooks/preserve-manual-memoization': 'warn',
  'react-hooks/purity': 'warn',
  'react-hooks/set-state-in-effect': 'warn',
  'react-hooks/use-memo': 'warn',
  '@next/next/no-html-link-for-pages': 'warn',
  '@next/next/no-img-element': 'warn',
  '@next/next/no-page-custom-font': 'warn',
};

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: inheritedDebtWarnings,
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    'docs/**',
  ]),
]);
