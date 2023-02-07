import { memoize2of4 } from '@graphql-tools/utils'
import type { DocumentNode, parse, validate } from 'graphql'
import { createLRUCache } from '../utils/create-lru-cache.js'
import type { Plugin } from './types.js'

interface Cache<T> {
  get(key: string): T | undefined
  set(key: string, value: T): void
}

export interface ParserAndValidationCacheOptions {
  documentCache?: Cache<DocumentNode>
  errorCache?: Cache<unknown>
  validationCache?: boolean | Cache<typeof validate>
}

export function useParserAndValidationCache({
  documentCache = createLRUCache(),
  errorCache = createLRUCache(),
  validationCache = true,
}: // eslint-disable-next-line @typescript-eslint/ban-types
ParserAndValidationCacheOptions): Plugin<{}> {
  const memoizedValidateByRules =
    typeof validationCache === 'boolean'
      ? createLRUCache<typeof validate>()
      : validationCache
  return {
    onParse({
      parseFn,
      setParseFn,
    }: {
      parseFn: typeof parse
      setParseFn: (fn: typeof parse) => void
    }) {
      setParseFn(function memoizedParse(source) {
        const strDocument = typeof source === 'string' ? source : source.body
        let document = documentCache.get(strDocument)
        if (!document) {
          const parserError = errorCache.get(strDocument)
          if (parserError) {
            throw parserError
          }
          try {
            document = parseFn(source)
          } catch (e) {
            errorCache.set(strDocument, e)
            throw e
          }
          documentCache.set(strDocument, document)
        }
        return document
      })
    },
    onValidate({
      validateFn,
      setValidationFn,
    }: {
      validateFn: typeof validate
      setValidationFn: (fn: typeof validate) => void
    }) {
      if (validationCache !== false) {
        setValidationFn(function memoizedValidateFn(schema, document, rules) {
          const rulesKey = rules?.map((rule) => rule.name).join(',') || ''
          let memoizedValidateFnForRules = memoizedValidateByRules.get(rulesKey)
          if (!memoizedValidateFnForRules) {
            memoizedValidateFnForRules = memoize2of4(validateFn)
            memoizedValidateByRules.set(rulesKey, memoizedValidateFnForRules)
          }
          return memoizedValidateFnForRules(schema, document, rules)
        })
      }
    },
  }
}
