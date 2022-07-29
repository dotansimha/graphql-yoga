import {
  IExecutableSchemaDefinition,
  makeExecutableSchema,
} from '@graphql-tools/schema'
import { GraphQLSchemaWithContext, YogaInitialContext } from './types.js'

export function createSchema<TContext = YogaInitialContext>(
  opts: IExecutableSchemaDefinition<TContext>,
): GraphQLSchemaWithContext<TContext> {
  return makeExecutableSchema<TContext>(opts)
}
