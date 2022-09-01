import { ExecutionResult } from 'graphql'
import { ExecutionPatchResult } from '../../types'

// JSON stringifier that removes http extensions from the result while serialising
export function jsonStringifyResult(
  result: ExecutionResult | ExecutionPatchResult,
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
