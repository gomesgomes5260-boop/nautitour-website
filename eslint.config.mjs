// Flat config (ESLint 9 + Next 16). Combina core-web-vitals + typescript do
// eslint-config-next. Adiciona ignore patterns pra paths gerados/externos.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'design/**',
      'docs/**',
      'db/migrations/**',
      'next-env.d.ts',
      'src/lib/supabase/database.types.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // 'react-hooks/purity' (nova em eslint-plugin-react-hooks v7) dá
      // false-positive em Server Components que usam Date.now() / new Date()
      // direto em render — comportamento perfeitamente válido em SSR.
      // Reativar quando a regra ficar SSR-aware ou usarmos cells/suspense.
      'react-hooks/purity': 'off',
    },
  },
];

export default config;
