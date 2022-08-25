import { Plugin } from '@envelop/types'
import { ExecutionResult, GraphQLError, GraphQLErrorExtensions } from 'graphql'
import { handleStreamOrSingleExecutionResult } from '@envelop/core'

const DEFAULT_ERROR_MESSAGE = 'Unexpected error.'

export type FormatErrorHandler = (
  error: GraphQLError | unknown,
  message: string,
  isDev: boolean,
) => GraphQLError

export const formatError: FormatErrorHandler = (err, message, isDev) => {
  if (err instanceof GraphQLError) {
    if (
      /** execution error */
      (err.originalError &&
        err.originalError instanceof GraphQLError === false) ||
      /** validate and parse errors */
      (err.originalError === undefined && err instanceof GraphQLError === false)
    ) {
      return new GraphQLError(
        message,
        err.nodes,
        err.source,
        err.positions,
        err.path,
        undefined,
        isDev
          ? {
              originalError: {
                message: err.originalError?.message ?? err.message,
                stack: err.originalError?.stack ?? err.stack,
              },
            }
          : undefined,
      )
    }
    return err
  }
  return new GraphQLError(message)
}

export type UseMaskedErrorsOpts = {
  /** The function used for format/identify errors. */
  formatError?: FormatErrorHandler
  /** The error message that shall be used for masked errors. */
  errorMessage?: string
  /**
   * Additional information that is forwarded to the `formatError` function.
   * The default value is `process.env['NODE_ENV'] === 'development'`
   */
  isDev?: boolean
  /**
   * Whether parse errors should be processed by this plugin.
   * In general it is not recommend to set this flag to `true`
   * as a `parse` error contains useful information for debugging a GraphQL operation.
   * A `parse` error never contains any sensitive information.
   * @default false
   */
  handleParseErrors?: boolean
  /**
   * Whether validation errors should processed by this plugin.
   * In general we recommend against setting this flag to `true`
   * as a `validate` error contains useful information for debugging a GraphQL operation.
   * A `validate` error contains "did you mean x" suggestions that make it easier
   * to reverse-introspect a GraphQL schema whose introspection capabilities got disabled.
   * Instead of disabling introspection and masking validation errors, using persisted operations
   * is a safer solution for avoiding the execution of unwanted/arbitrary operations.
   * @default false
   */
  handleValidationErrors?: boolean
}

const makeHandleResult =
  (format: FormatErrorHandler, message: string, isDev: boolean) =>
  ({
    result,
    setResult,
  }: {
    result: ExecutionResult
    setResult: (result: ExecutionResult) => void
  }) => {
    if (result.errors != null) {
      setResult({
        ...result,
        errors: result.errors.map((error) => format(error, message, isDev)),
      })
    }
  }

export const useMaskedErrors = (opts?: UseMaskedErrorsOpts): Plugin => {
  const format = opts?.formatError ?? formatError
  const message = opts?.errorMessage || DEFAULT_ERROR_MESSAGE
  // eslint-disable-next-line dot-notation
  const isDev =
    opts?.isDev ??
    (typeof process !== 'undefined'
      ? process.env['NODE_ENV'] === 'development'
      : false)
  const handleResult = makeHandleResult(format, message, isDev)

  return {
    onParse:
      opts?.handleParseErrors === true
        ? function onParse() {
            return function onParseEnd({ result, replaceParseResult }) {
              if (result instanceof Error) {
                replaceParseResult(format(result, message, isDev))
              }
            }
          }
        : undefined,
    onValidate:
      opts?.handleValidationErrors === true
        ? function onValidate() {
            return function onValidateEnd({ valid, result, setResult }) {
              if (valid === false) {
                setResult(result.map((error) => format(error, message, isDev)))
              }
            }
          }
        : undefined,
    onPluginInit(context) {
      context.registerContextErrorHandler(({ error, setError }) => {
        if (error instanceof GraphQLError === false && error instanceof Error) {
          error = new GraphQLError(
            error.message,
            undefined,
            undefined,
            undefined,
            undefined,
            error,
          )
        }
        setError(format(error, message, isDev))
      })
    },
    onExecute() {
      return {
        onExecuteDone(payload) {
          return handleStreamOrSingleExecutionResult(payload, handleResult)
        },
      }
    },
    onSubscribe() {
      return {
        onSubscribeResult(payload) {
          return handleStreamOrSingleExecutionResult(payload, handleResult)
        },
        onSubscribeError({ error, setError }) {
          setError(format(error, message, isDev))
        },
      }
    },
  }
}
