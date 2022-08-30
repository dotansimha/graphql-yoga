/**
 *
 * PROPOSAL of an server agnostic envelop plugin replacing the deprecated `onResolverCalled` hook.
 *
 * Example usage:
 * ```ts
 * import { Plugin } from '@envelop/core';
 * import { useOnResolver } from '@envelop/on-resolver';
 *
 * interface PluginContext {
 *   tracerUrl: string
 * }
 *
 * function useTracedSchema(): Plugin<PluginContext> {
 *   return {
 *     onSchemaChange: async ({ schema }) => {
 *       useOnResolver<PluginContext>(schema, async ({ context, info }) => {
 *         await fetch(context.tracerUrl, {
 *           method: 'POST',
 *           headers: {
 *             'content-type': 'application/json',
 *           },
 *           body: JSON.stringify({ startedResolving: info }),
 *         })
 *
 *         return async () => {
 *           await fetch(context.tracerUrl, {
 *             method: 'POST',
 *             headers: {
 *               'content-type': 'application/json',
 *             },
 *             body: JSON.stringify({ endedResolving: info }),
 *           })
 *         }
 *       })
 *     },
 *   }
 * }
 * ```
 *
 */

import {
  defaultFieldResolver,
  GraphQLResolveInfo,
  GraphQLSchema,
  isIntrospectionType,
  isObjectType,
} from 'graphql'

export type PromiseOrValue<T> = Promise<T> | T

export type Resolver<Context = unknown> = (
  root: unknown,
  args: unknown,
  context: Context,
  info: GraphQLResolveInfo,
) => PromiseOrValue<unknown>

export type AfterResolver = (options: {
  result: unknown
  setResult: (newResult: unknown) => void
}) => void

export function useOnResolver<PluginContext extends Record<string, any> = {}>(
  schema: GraphQLSchema,
  onResolver: (options: {
    context: PluginContext
    root: unknown
    args: unknown
    info: GraphQLResolveInfo
    resolver: Resolver<PluginContext>
    replaceResolver: (newResolver: Resolver<PluginContext>) => void
  }) => PromiseOrValue<void | AfterResolver>,
) {
  for (const type of Object.values(schema.getTypeMap())) {
    if (!isIntrospectionType(type) && isObjectType(type)) {
      for (const field of Object.values(type.getFields())) {
        let resolver = (field.resolve ||
          defaultFieldResolver) as Resolver<PluginContext>

        field.resolve = async (root, args, context, info) => {
          const afterResolver = await onResolver({
            root,
            args,
            context,
            info,
            resolver,
            replaceResolver: (newResolver) => {
              resolver = newResolver
            },
          })

          let result
          try {
            result = await resolver(root, args, context, info)
          } catch (err) {
            result = err as Error
          }

          if (typeof afterResolver === 'function') {
            afterResolver({
              result,
              setResult: (newResult) => {
                result = newResult
              },
            })
          }

          if (result instanceof Error) {
            throw result
          }

          return result
        }
      }
    }
  }
}
