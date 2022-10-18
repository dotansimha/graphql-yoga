import { ExecutionResult } from '@graphql-tools/graphql'
import { ExecutionPatchResult, MaybeArray } from '../../types'

// JSON stringifier that adjusts the result extensions while serialising
export function jsonStringifyResult(
  result: MaybeArray<ExecutionResult | ExecutionPatchResult>,
) {
  return JSON.stringify(result, (key, value) => {
    if (key === 'extensions') {
      // omit http extensions
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
