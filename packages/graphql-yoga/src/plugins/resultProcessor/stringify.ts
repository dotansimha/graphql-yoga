import { ExecutionResult } from 'graphql'
import { ExecutionPatchResult } from '../../types'

type MaybeArray<T> = T | T[]

// JSON stringifier that adjusts the result extensions while serialising
export function jsonStringifyResult(
  result: MaybeArray<ExecutionResult | ExecutionPatchResult>,
) {
  return JSON.stringify(result, (key, value) => {
    if (key === 'extensions') {
      // omit http extensions
      const { http, ...extensions } = value

      // remove empty extensions object
      if (Object.keys(extensions).length === 0) {
        return undefined
      }

      return extensions
    }
    return value
  })
}
