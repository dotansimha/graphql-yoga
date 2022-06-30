const { resolve } = require('path')
const { pathsToModuleNameMapper } = require('ts-jest')
const CI = !!process.env.CI

const ROOT_DIR = __dirname
const TSCONFIG = resolve(ROOT_DIR, 'tsconfig.json')
const tsconfig = require(TSCONFIG)

process.env.LC_ALL = 'en_US'

const testMatch = [
  '**/?(*.)+(spec|test).[jt]s?(x)',
  '!**/examples/node-esm/**',
  '!**/.bob/**',
]

if (parseInt(process.versions.node.split('.')[0]) <= 14) {
  testMatch.push('!**/examples/sveltekit/**')
  testMatch.push('!**/examples/fastify*/**')
}

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
  // TODO: Remove once we drop Node 12 support
  transformIgnorePatterns: ['node_modules/(?!fastify)'],
  resolver: 'bob-the-bundler/jest-resolver.js',
}
