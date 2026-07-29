import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // Ligne de base temporaire pour le code historique, antérieur à ESLint 9 / React 19.
    // Les fichiers de la nouvelle vitrine sont réactivés en erreur ci-dessous.
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'prefer-rest-params': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
  {
    files: [
      'src/app/(public)/blog/**/*.{ts,tsx}',
      'src/app/(public)/concept/**/*.{ts,tsx}',
      'src/app/(public)/confier-mon-logement/**/*.{ts,tsx}',
      'src/app/(public)/connexion/**/*.{ts,tsx}',
      'src/app/(public)/layout.tsx',
      'src/app/(public)/logements/**/*.{ts,tsx}',
      'src/app/(public)/page.tsx',
      'src/app/(public)/seminaires/**/*.{ts,tsx}',
      'src/app/layout.tsx',
      'src/features/lodging-showcase/queries/public-lodgings.ts',
      'src/features/marketing/**/*.{ts,tsx}',
      'src/proxy.ts',
      'tests/**/*public-marketing*.{ts,tsx}',
      'tests/unit/public-home.anonymous.test.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      'prefer-rest-params': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/refs': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/static-components': 'error',
      'react/no-unescaped-entities': 'error',
    },
  },
  globalIgnores([
    '.next/**',
    '.worktrees/**',
    'build/**',
    'next-env.d.ts',
    'out/**',
    'references/**',
  ]),
])
