import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Layer boundaries (Clean Architecture, see docs/DECISIONS.md):
 *
 *   presentation -> application -> domain <- infrastructure
 *
 * `container.ts` is the only place allowed to wire everything together.
 */
const frameworkModules = [
  'express',
  'zod',
  'pino',
  'pino-http',
  'jsonwebtoken',
  'argon2',
  '@prisma/client',
  'prisma',
];

const frameworkImports = frameworkModules.map((name) => ({
  group: [name, `${name}/*`],
  message: `"${name}" is a framework dependency and may not be imported from this layer.`,
}));

const layer = (name, message) => ({
  group: [`**/${name}/**`],
  message,
});

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'pnpm-lock.yaml'] },
  js.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      'no-console': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },

  /* domain/ is pure TypeScript: no frameworks, no other layers */
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            layer('application', 'domain/ must not import the application layer.'),
            layer('infrastructure', 'domain/ must not import the infrastructure layer.'),
            layer('presentation', 'domain/ must not import the presentation layer.'),
            layer('config', 'domain/ must not import configuration.'),
            ...frameworkImports,
          ],
        },
      ],
    },
  },

  /* application/ may import domain/ only */
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            layer('infrastructure', 'application/ talks to infrastructure through ports only.'),
            layer('presentation', 'application/ must not import the presentation layer.'),
            layer('config', 'application/ must not import configuration.'),
            ...frameworkImports,
          ],
        },
      ],
    },
  },

  /* infrastructure/ implements domain + application ports */
  {
    files: ['src/infrastructure/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [layer('presentation', 'infrastructure/ must not import the presentation layer.')] },
      ],
    },
  },

  /* presentation/ never talks to Prisma directly */
  {
    files: ['src/presentation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@prisma/client', 'prisma', '**/infrastructure/repositories/**'],
              message: 'Controllers must never touch repositories; call an application use case instead.',
            },
          ],
        },
      ],
    },
  },

  /* composition root and cross-cutting infrastructure are exempt from layer rules */
  {
    files: [
      'src/container.ts',
      'src/app.ts',
      'src/server.ts',
      'src/config/**/*.ts',
      'src/infrastructure/logging/**/*.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },

  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },

  /* in-memory fakes must satisfy async ports without performing any I/O */
  {
    files: ['tests/fakes/**/*.ts'],
    rules: { '@typescript-eslint/require-await': 'off' },
  },

  /* CLI scripts may write to stdout; application code may not */
  {
    files: ['prisma/**/*.ts'],
    rules: {
      'no-console': 'off',
      'no-restricted-imports': 'off',
    },
  },

  prettier,
);
