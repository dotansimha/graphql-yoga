module.exports = {
  root: true,
  extends: ['@theguild'],
  overrides: [
    {
      files: ['packages/graphql-yoga/src/plugins/**/*.ts'],
      rules: {
        'unicorn/filename-case': 'off',
      },
    },
    {
      files: ['examples/**/*'],
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
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: [
              '**/*.test.ts',
              '**/*.spec.ts',
              '**/scripts/*.js',
              '**/vite.config.ts',
            ],
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'graphql',
                importNames: [
                  'execute',
                  'subscribe',
                  'graphql',
                  'executeSync',
                  'graphqlSync',
                ],
                message:
                  'Please use `normalizedExecutor` from `@graphql-tools/executor` instead.',
              },
            ],
          },
        ],
      },
    },
  ],
}
