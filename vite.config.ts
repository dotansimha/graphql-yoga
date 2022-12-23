import { defineConfig, configDefaults } from 'vitest/config'
import { compilerOptions } from './tsconfig.json'

const alias = Object.fromEntries(
  Object.entries(compilerOptions.paths).map(([key, [value]]) => [key, value]),
)

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./serializer.js'],
    alias: {
      ...alias,
      '@graphql-yoga/plugin-response-cache':
        'packages/plugins/response-cache/src/index.ts',
      '@graphql-yoga/plugin-persisted-operations':
        'packages/plugins/persisted-operations/src/index.ts',
      '@graphql-yoga/plugin-sofa': 'packages/plugins/sofa/src/index.ts',
      '@graphql-yoga/plugin-disable-introspection':
        'packages/plugins/disable-introspection/src/index.ts',
      '@graphql-yoga/plugin-defer-stream':
        'packages/plugins/defer-stream/src/index.ts',
      '@graphql-yoga/plugin-apq': 'packages/plugins/apq/src/index.ts',
      '@graphql-yoga/redis-event-target':
        'packages/event-target/redis-event-target/src/index.ts',
    },
    exclude: [...configDefaults.exclude, '**/.bob/**'],
  },
})
