import chalk from 'chalk'
import { inspect } from '@graphql-tools/utils'

type MessageTransformer = (msg: string) => string

const warnColor: MessageTransformer = chalk.keyword(`orange`)
const infoColor: MessageTransformer = chalk.cyan
const errorColor: MessageTransformer = chalk.red
const debugColor: MessageTransformer = chalk.magenta
const titleBold: MessageTransformer = chalk.bold

export interface YogaLogger {
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

const isDebug = () => (typeof process === 'object' ? process.env.DEBUG : false)

function getPrefix() {
  return titleBold(`🧘 Yoga -`)
}

function getLoggerMessage(...args: any[]) {
  return args
    .map((arg) => (typeof arg === 'string' ? arg : inspect(arg)))
    .join(` `)
}

export const defaultYogaLogger: YogaLogger = {
  debug(...args: any[]) {
    if (isDebug()) {
      const message = getLoggerMessage(...args)
      const fullMessage = `${getPrefix()} 🐛 ${debugColor(message)}`
      // Some environments don't have other console methods
      if (console.debug) {
        console.debug(fullMessage)
      } else {
        console.log(fullMessage)
      }
    }
  },
  info(...args: any[]) {
    const message = getLoggerMessage(...args)
    const fullMessage = `${getPrefix()} 💡 ${infoColor(message)}`
    if (console.info) {
      console.info(fullMessage)
    } else {
      console.log(fullMessage)
    }
  },
  warn(...args: any[]) {
    const message = getLoggerMessage(...args)
    const fullMessage = `${getPrefix()} ⚠️ ${warnColor(message)}`
    if (console.warn) {
      console.warn(fullMessage)
    } else {
      console.log(fullMessage)
    }
  },
  error(...args: any[]) {
    const message = getLoggerMessage(...args)
    const fullMessage = `${getPrefix()} ❌ ${errorColor(message)}`
    if (console.error) {
      console.error(fullMessage)
    } else {
      console.log(fullMessage)
    }
  },
}
