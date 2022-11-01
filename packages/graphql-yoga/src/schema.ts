import {
  IExecutableSchemaDefinition,
  makeExecutableSchema,
} from '@graphql-tools/schema'
import { GraphQLSchemaWithContext, YogaInitialContext } from './types.js'

export function createSchema<TContext = YogaInitialContext>(
  opts: IExecutableSchemaDefinition<TContext>,
): GraphQLSchemaWithContext<TContext> {
  return makeExecutableSchema<TContext>({
    ...opts,
    typeDefs: [
      /* GraphQL */ `
        directive @defer(
          if: Boolean
          label: String
        ) on FRAGMENT_SPREAD | INLINE_FRAGMENT
        directive @stream(
          if: Boolean
          label: String
          initialCount: Int = 0
        ) on FIELD
      `,
      opts.typeDefs,
    ],
  })
}
