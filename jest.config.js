const { resolve } = require('path')
const CI = !!process.env.CI

const ROOT_DIR = __dirname
const TSCONFIG = resolve(ROOT_DIR, 'tsconfig.json')
const tsconfig = require(TSCONFIG)

module.exports = {
  testEnvironment: 'node',
  rootDir: ROOT_DIR,
  restoreMocks: true,
  reporters: ['default'],
  // TODO: get tests for `examples`
  modulePathIgnorePatterns: ['dist'],
  moduleNameMapper: {
    '@graphql-yoga/common': '<rootDir>/packages/common/src/index.ts',
    '@graphql-yoga/subscription':
      '<rootDir>/packages/subscription/src/index.ts',
    '@graphql-yoga/node': '<rootDir>/packages/node/src/index.ts',
    '@graphql-yoga/render-graphiql':
      '<rootDir>/packages/render-graphiql/src/index.ts',
    'graphql-yoga': '<rootDir>/packages/graphql-yoga/src/index.ts',
  },
  collectCoverage: true,
  cacheDirectory: resolve(ROOT_DIR, `${CI ? '' : 'node_modules/'}.cache/jest`),
  testMatch: [
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '!**/examples/cloudflare-modules/**',
    '!**/examples/node-esm/**',
  ],
}
