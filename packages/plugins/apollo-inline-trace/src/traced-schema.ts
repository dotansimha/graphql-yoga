import {
  defaultFieldResolver,
  GraphQLSchema,
  isIntrospectionType,
  isObjectType,
} from 'graphql'
import {
  AfterResolverHook,
  OnResolverCalledHook,
  ResolverFn,
} from '@envelop/types'
import { resolversHooksSymbol } from '@envelop/core'

const trackedSchemaSymbol = Symbol('TRACKED_SCHEMA')

export function prepareTracedSchema(
  schema: GraphQLSchema | null | undefined,
): void {
  if (!schema || schema[trackedSchemaSymbol]) {
    return
  }

  schema[trackedSchemaSymbol] = true
  const entries = Object.values(schema.getTypeMap())

  for (const type of entries) {
    if (!isIntrospectionType(type) && isObjectType(type)) {
      const fields = Object.values(type.getFields())

      for (const field of fields) {
        let resolverFn: ResolverFn = (field.resolve ||
          defaultFieldResolver) as ResolverFn

        field.resolve = async (root, args, context, info) => {
          if (context && context[resolversHooksSymbol]) {
            const hooks: OnResolverCalledHook[] = context[resolversHooksSymbol]
            const afterCalls: AfterResolverHook[] = []

            for (const hook of hooks) {
              const afterFn = await hook({
                root,
                args,
                context,
                info,
                resolverFn,
                replaceResolverFn: (newFn) => {
                  resolverFn = newFn as ResolverFn
                },
              })
              afterFn && afterCalls.push(afterFn)
            }

            try {
              let result = await resolverFn(root, args, context, info)

              for (const afterFn of afterCalls) {
                afterFn({
                  result,
                  setResult: (newResult) => {
                    result = newResult
                  },
                })
              }

              return result
            } catch (e) {
              let resultErr = e

              for (const afterFn of afterCalls) {
                afterFn({
                  result: resultErr,
                  setResult: (newResult) => {
                    resultErr = newResult
                  },
                })
              }

              throw resultErr
            }
          } else {
            return resolverFn(root, args, context, info)
          }
        }
      }
    }
  }
}
