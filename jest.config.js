const { resolve } = require('path')
const { pathsToModuleNameMapper } = require('ts-jest')
const CI = !!process.env.CI

const ROOT_DIR = __dirname
const TSCONFIG = resolve(ROOT_DIR, 'tsconfig.json')
const tsconfig = require(TSCONFIG)

process.env.LC_ALL = 'en_US'

module.exports = {
  testEnvironment: 'node',
  rootDir: ROOT_DIR,
  restoreMocks: true,
  reporters: ['default'],
  modulePathIgnorePatterns: ['dist'],
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: `${ROOT_DIR}/`,
  }),
  collectCoverage: false,
  cacheDirectory: resolve(ROOT_DIR, `${CI ? '' : 'node_modules/'}.cache/jest`),
  testMatch: [
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '!**/examples/cloudflare-modules/**',
    '!**/examples/node-esm/**',
  ],
  extensionsToTreatAsEsm: ['.ts'],
}
