import globals from 'globals'
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

const styleGuardSelectors = [
  {
    selector: "JSXAttribute[name.name='style']",
    message:
      'Evita style={{}} fuera del DS. Usa CSS Modules o primitives del design-system.',
  },
  {
    selector:
      'Literal[value=/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]',
    message:
      'No uses colores hex en TSX. Usa tokens del design-system o clases de theme Tailwind.',
  },
]

const tailwindOutsideSharedSelector = {
  selector:
    "JSXAttribute[name.name='className'][value.type='Literal'][value.value=/\\b(?:container|hidden|block|inline|flex|grid|p(?:x|y|t|r|b|l)?-|m(?:x|y|t|r|b|l)?-|w-|h-|min-|max-|bg-|text-|border-|rounded|shadow|items-|justify-|gap-|font-|leading-|tracking-|animate-|transition-|hover:|focus:|sm:|md:|lg:|xl:)/]",
  message:
    'Utilities Tailwind directas deben vivir en @shared/ui. En features/pages usa componentes del DS.',
}

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/shared/ui/design-system/**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['warn', ...styleGuardSelectors, tailwindOutsideSharedSelector],
    },
  },
  {
    files: ['src/shared/ui/**/*.tsx'],
    ignores: ['src/shared/ui/design-system/**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['warn', ...styleGuardSelectors],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@app',
            '@app/*',
            '@pages',
            '@pages/*',
            '@widgets',
            '@widgets/*',
            '@features',
            '@features/*',
            '@caracteristicas',
            '@caracteristicas/*',
            '@entities',
            '@entities/*',
            '@entidades',
            '@entidades/*',
          ],
        },
      ],
    },
  },
  prettier,
]