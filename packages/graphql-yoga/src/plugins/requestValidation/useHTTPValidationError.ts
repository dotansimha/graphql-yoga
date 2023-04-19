import type { Plugin } from '../types.js'

export function useHTTPValidationError<
  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
  PluginContext extends Record<string, any> = {},
>(): Plugin<PluginContext> {
  return {
    onValidate() {
      return ({ valid, result }) => {
        if (!valid) {
          result.forEach((error) => {
            error.extensions.http = {
              spec: true,
              status: 400,
            }
          })
        }
      }
    },
  }
}
