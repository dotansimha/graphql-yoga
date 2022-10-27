module.exports = {
  extends: ['@theguild'],
  overrides: [
    {
      files: ['packages/graphql-yoga/src/plugins/**/*.ts'],
      rules: {
        'unicorn/filename-case': 'off',
      },
    },
    {
      files: ['website/**'],
      rules: { 'import/no-default-export': 'off' },
    },
    {
      files: ['examples/**'],
      rules: {
        'import/extensions': 'off',
        'unicorn/filename-case': 'off',
        'no-console': 'off',
        'import/no-default-export': 'off',
      },
    },
    {
      files: [
        '**/__tests__/**',
        '**/*.spec.ts',
        '**/*.test.ts',
        'e2e/**',
        '**/__integration-tests__/**',
      ],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        'import/extensions': 'off',
        'unicorn/filename-case': 'off',
      },
    },
    {
      files: ['e2e/**'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['packages/graphiql/**', 'packages/render-graphiql/**'],
      rules: {
        'unicorn/filename-case': 'off',
        'import/extensions': 'off',
        'import/no-default-export': 'off',
      },
    },
    {
      files: ['packages/**/*'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'graphql',
                importNames: ['execute', 'subscribe'],
                message:
                  'Please use `execute` and `subscribe` from `@graphql-tools/executor` instead.',
              },
            ],
          },
        ],
      },
    },
  ],
}
