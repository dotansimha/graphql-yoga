import type { IExecutableSchemaDefinition } from '@graphql-tools/schema'
import { GraphQLSchemaWithContext, YogaInitialContext } from './types.js'
import {
  addResolversToExistingSchema,
  buildSchema,
  Source,
} from '@graphql-tools/graphql'

export function createSchema<TContext = YogaInitialContext>(opts: {
  typeDefs: string | Source
  resolvers?: IExecutableSchemaDefinition<TContext>['resolvers']
}): GraphQLSchemaWithContext<TContext> {
  let schema = buildSchema(opts.typeDefs)
  addResolversToExistingSchema(schema, opts.resolvers)
  return schema
}
