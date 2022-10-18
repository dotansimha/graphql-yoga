// https://github.com/n1ru4l/envelop/blob/main/packages/plugins/validation-cache/src/index.ts
import { Plugin } from '@envelop/core'
import { GraphQLError, print } from '@graphql-tools/graphql'
import LRU from 'lru-cache'

export interface ValidationCache {
  /**
   * Get a result from the validation cache.
   */
  get(key: string): readonly GraphQLError[] | undefined
  /**
   * Set a result to the validation cache.
   */
  set(key: string, value: readonly GraphQLError[]): void
  /**
   * @deprecated Provide a `reset` implementation instead.
   */
  clear?(): void
  /**
   * Reset the cache by clearing all entries.
   */
  reset?(): void
}

type ValidationCacheOptions = {
  cache?: ValidationCache
}

const DEFAULT_MAX = 1000
const DEFAULT_TTL = 3600000

const rawDocumentSymbol = Symbol('rawDocument')

export const useValidationCache = (
  pluginOptions: ValidationCacheOptions = {},
): Plugin => {
  const resultCache =
    typeof pluginOptions.cache !== 'undefined'
      ? pluginOptions.cache
      : new LRU<string, readonly GraphQLError[]>({
          max: DEFAULT_MAX,
          maxAge: DEFAULT_TTL,
        })

  return {
    onSchemaChange() {
      if (resultCache.reset) {
        resultCache.reset?.()
      } else if ('clear' in resultCache) {
        resultCache.clear?.()
      }
    },
    onParse({ params, extendContext }) {
      extendContext({ [rawDocumentSymbol]: params.source.toString() })
    },
    onValidate({ params, context, setResult }) {
      const key: string =
        context[rawDocumentSymbol] ?? print(params.documentAST)
      const cachedResult = resultCache.get(key)

      if (cachedResult !== undefined) {
        setResult(cachedResult)
      }

      return ({ result }) => {
        resultCache.set(key, result as GraphQLError[])
      }
    },
  }
}
