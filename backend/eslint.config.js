import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'drizzle', '.data', 'node_modules'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      // logs go through Nest's Logger, so every line carries its context
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false }],
    },
  },
  {
    // Nest resolves constructor parameters from their runtime types: a type-only import would erase them
    files: ['src/**/*.controller.ts', 'src/**/*.service.ts', 'src/**/*.repository.ts', 'src/**/*.job.ts', 'src/**/*.guard.ts'],
    rules: { '@typescript-eslint/consistent-type-imports': 'off' },
  },
);
