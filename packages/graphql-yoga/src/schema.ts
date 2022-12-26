import {
  IExecutableSchemaDefinition,
  makeExecutableSchema,
} from '@graphql-tools/schema'

import { GraphQLSchemaWithContext, YogaInitialContext } from './types.js'

// eslint-disable-next-line @typescript-eslint/ban-types
export function createSchema<TContext = {}>(
  opts: IExecutableSchemaDefinition<TContext & YogaInitialContext>,
): GraphQLSchemaWithContext<TContext> {
  return makeExecutableSchema<TContext & YogaInitialContext>(opts)
}
