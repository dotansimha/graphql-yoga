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
    '@graphql-yoga/core': '<rootDir>/packages/core/src/index.ts',
    '@graphql-yoga/handler': '<rootDir>/packages/handler/src/index.ts',
    'graphql-yoga': '<rootDir>/packages/graphql-yoga/src/index.ts',
    '@graphql-yoga/cli': '<rootDir>/packages/cli/src/index.ts',
  },
  collectCoverage: true,
  cacheDirectory: resolve(ROOT_DIR, `${CI ? '' : 'node_modules/'}.cache/jest`),
}
