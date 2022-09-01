import { ExecutionResult } from 'graphql'
import { ExecutionPatchResult } from '../../types'

// JSON stringifier that removes http extensions from the result while serialising
export function jsonStringifyResult(
  result: ExecutionResult | ExecutionPatchResult,
) {
  return JSON.stringify(result, (key, value) => {
    if (key === 'extensions') {
      const { http, ...rest } = value
      return rest
    }
    return value
  })
}
