const { resolve } = require('path')
const { pathsToModuleNameMapper } = require('ts-jest')
const CI = !!process.env.CI

const ROOT_DIR = __dirname
const TSCONFIG = resolve(ROOT_DIR, 'tsconfig.json')
const tsconfig = require(TSCONFIG)

process.env.LC_ALL = 'en_US'

const testMatch = []

if (process.env.INTEGRATION_TEST === 'true') {
  testMatch.push(
    '<rootDir>/**/__integration-tests__/**/?(*.)+(spec|test).[jt]s?(x)',
  )
  if (parseInt(process.versions.node.split('.')[0]) <= 14) {
    testMatch.push('!<rootDir>/**/examples/sveltekit/**')
    testMatch.push('!<rootDir>/**/examples/fastify*/**')
  }
} else {
  testMatch.push(
    '<rootDir>/packages/**/?(*.)+(spec|test).[jt]s?(x)',
    '!**/__integration-tests__/**',
  )
}

testMatch.push('!**/dist/**', '!**/.bob/**')

module.exports = {
  testEnvironment: 'node',
  rootDir: ROOT_DIR,
  restoreMocks: true,
  reporters: ['default'],
  modulePathIgnorePatterns: ['dist'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
      prefix: `${ROOT_DIR}/`,
    }),
    'formdata-node': '<rootDir>/node_modules/formdata-node/lib/cjs/index.js',
  },
  collectCoverage: false,
  cacheDirectory: resolve(ROOT_DIR, `${CI ? '' : 'node_modules/'}.cache/jest`),
  testMatch,
  resolver: 'bob-the-bundler/jest-resolver.js',
}
