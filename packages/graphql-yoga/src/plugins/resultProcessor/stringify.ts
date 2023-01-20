import { ExecutionResult } from '@graphql-tools/utils'

import type { MaybeArray } from '../../types.js'

// JSON stringifier that adjusts the result extensions while serialising
export function jsonStringifyResult(result: MaybeArray<ExecutionResult>) {
  return JSON.stringify(result, (key, value) => {
    if (
      key === 'extensions' &&
      value != null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      // omit http extensions
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { http, unexpected, ...extensions } = value

      // remove empty extensions object
      if (Object.keys(extensions).length === 0) {
        return undefined
      }

      return extensions
    }
    return value
  })
}
