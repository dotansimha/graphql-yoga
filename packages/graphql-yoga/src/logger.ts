/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
type MessageTransformer = (msg: string) => string

const ANSI_CODES = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  orange: '\x1b[48:5:166m',
}

export const warnColor: MessageTransformer = (msg) =>
  ANSI_CODES.orange + msg + ANSI_CODES.reset
export const infoColor: MessageTransformer = (msg) =>
  ANSI_CODES.cyan + msg + ANSI_CODES.reset
export const errorColor: MessageTransformer = (msg) =>
  ANSI_CODES.red + msg + ANSI_CODES.reset
export const debugColor: MessageTransformer = (msg) =>
  ANSI_CODES.magenta + msg + ANSI_CODES.reset
export const titleBold: MessageTransformer = (msg) =>
  ANSI_CODES.bold + msg + ANSI_CODES.reset

const LEVEL_COLOR = {
  warn: ANSI_CODES.orange,
  info: ANSI_CODES.cyan,
  error: ANSI_CODES.red,
  debug: ANSI_CODES.magenta,
  title: ANSI_CODES.bold,
  reset: ANSI_CODES.reset,
}

export interface YogaLogger {
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

const isDebug = () => !!globalThis.process?.env?.DEBUG

const prefix = [LEVEL_COLOR.title, `🧘 Yoga -`, LEVEL_COLOR.reset]

export const defaultYogaLogger: YogaLogger = {
  debug(...args: any[]) {
    if (isDebug()) {
      const fullMessage = [
        `🐛 `,
        ...prefix,
        LEVEL_COLOR.debug,
        ...args,
        LEVEL_COLOR.reset,
      ]
      // Some environments don't have other console methods
      if (console.debug) {
        console.debug(...fullMessage)
      } else {
        console.log(...fullMessage)
      }
    }
  },
  info(...args: any[]) {
    const fullMessage = [
      `💡 `,
      ...prefix,
      LEVEL_COLOR.info,
      ...args,
      LEVEL_COLOR.reset,
    ]
    if (console.info) {
      console.info(...fullMessage)
    } else {
      console.log(...fullMessage)
    }
  },
  warn(...args: any[]) {
    const fullMessage = [
      `⚠️ `,
      ...prefix,
      LEVEL_COLOR.warn,
      ...args,
      LEVEL_COLOR.reset,
    ]
    if (console.warn) {
      console.warn(...fullMessage)
    } else {
      console.log(...fullMessage)
    }
  },
  error(...args: any[]) {
    const fullMessage = [
      `❌ `,
      ...prefix,
      LEVEL_COLOR.error,
      ...args,
      LEVEL_COLOR.reset,
    ]
    if (console.error) {
      console.error(...fullMessage)
    } else {
      console.log(...fullMessage)
    }
  },
}
