import type { Plugin } from '../types'
import { createGraphQLError } from '@graphql-tools/utils'

export function useGraphQLErrorForScalars<
  PluginContext extends Record<string, unknown> = Record<string, unknown>,
>(): Plugin<PluginContext> {
  return {
    onExecute() {
      return {
        onExecuteDone({ result }) {
          if ('errors' in result && result.errors?.length) {
            for (let i = 0; i < result.errors.length; i++) {
              const err = result.errors[i]

              // a graphql-scalar type error looks like this:
              // TypeError('Unable to parse', { path: any, extensions: any, locations: any })
              if ('message' in err && 'path' in err && 'extensions' in err) {
                // @ts-expect-error easier to just mutate the original
                result.errors[i] = createGraphQLError(err.message, {
                  path: err.path,
                  originalError: err,
                  extensions: {
                    ...err.extensions,
                    http: {
                      status: 400,
                    },
                  },
                })

                // TODO: locations field cannot be set through `createGraphQLError`
                result.errors[i].locations = err.locations
              }
            }
          }
        },
      }
    },
  }
}
