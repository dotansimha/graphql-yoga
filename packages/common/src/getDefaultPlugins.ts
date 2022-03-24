import {
  Plugin,
  useLogger,
  useMaskedErrors,
  UseMaskedErrorsOpts,
} from '@envelop/core'
import { ParserCacheOptions, useParserCache } from '@envelop/parser-cache'
import {
  useValidationCache,
  ValidationCacheOptions,
} from '@envelop/validation-cache'
import { defaultYogaLogger, YogaLogger } from './logger'
import { YogaInitialContext } from './types'

type GetPluginsOpts = {
  parserCache?: boolean | ParserCacheOptions
  validationCache?: boolean | ValidationCacheOptions
  /**
   * Prevent leaking unexpected errors to the client. We highly recommend enabling this in production.
   * If you throw `GraphQLYogaError`/`EnvelopError` within your GraphQL resolvers then that error will be sent back to the client.
   *
   * You can lean more about this here:
   * @see https://graphql-yoga.vercel.app/docs/features/error-masking
   *
   * Default: `true`
   */
  maskedErrors?: boolean | UseMaskedErrorsOpts
  logging?: boolean | YogaLogger
}

export function getDefaultPlugins<TContext extends Record<string, any>>(
  options?: GetPluginsOpts,
): Array<Plugin<TContext>> {
  const plugins: Array<Plugin<any>> = []

  if (options?.parserCache !== false) {
    plugins.push(
      useParserCache(
        typeof options?.parserCache === 'object'
          ? options?.parserCache
          : undefined,
      ),
    )
  }
  if (options?.validationCache !== false) {
    plugins.push(
      useValidationCache(
        typeof options?.validationCache === 'object'
          ? options?.validationCache
          : undefined,
      ),
    )
  }
  if (options?.logging !== false) {
    const loggerOption = options?.logging != null ? options.logging : true
    const logger =
      typeof loggerOption === 'boolean'
        ? loggerOption === true
          ? defaultYogaLogger
          : {
              debug: () => {},
              error: () => {},
              warn: () => {},
              info: () => {},
            }
        : loggerOption
    plugins.push(
      useLogger({
        logFn: (eventName, events) => {
          logger.debug(eventName)
          switch (eventName) {
            case 'execute-start':
              const { query, variables, operationName }: YogaInitialContext =
                events.args.contextValue
              logger.debug(query, 'query')
              logger.debug(operationName, 'headers')
              logger.debug(variables, 'variables')
              break
            case 'execute-end':
              logger.debug(events.result, 'response')
              break
          }
        },
      }),
    )
  }
  if (options?.maskedErrors !== false) {
    plugins.push(
      useMaskedErrors(
        typeof options?.maskedErrors === 'object'
          ? options?.maskedErrors
          : undefined,
      ),
    )
  }

  return plugins
}
