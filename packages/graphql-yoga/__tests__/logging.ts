/* eslint-disable no-console */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const logLevelScores: Record<LogLevel | 'silent', number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

/**
 * utility for creating a conditional logger for tests.
 */
export const createCustomLogger = (
  logLevel: LogLevel | 'silent' = globalThis?.process.env['DEBUG'] === '1'
    ? 'debug'
    : 'info',
) => {
  const score = logLevelScores[logLevel]
  return {
    debug: score > logLevelScores.debug ? noop : debugLog,
    info: score > logLevelScores.info ? noop : infoLog,
    warn: score > logLevelScores.warn ? noop : warnLog,
    error: score > logLevelScores.error ? noop : errorLog,
  }
}

const consoleLog = (...args: Array<any>) => console.log(...args)

const debugLog = console.debug
  ? (...args: Array<any>) => console.debug(...args)
  : consoleLog
const infoLog = console.info
  ? (...args: Array<any>) => console.info(...args)
  : consoleLog
const warnLog = console.warn
  ? (...args: Array<any>) => console.warn(...args)
  : consoleLog
const errorLog = console.error
  ? (...args: Array<any>) => console.error(...args)
  : consoleLog
