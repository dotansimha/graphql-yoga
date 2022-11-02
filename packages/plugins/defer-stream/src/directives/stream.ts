import {
  DirectiveLocation,
  GraphQLBoolean,
  GraphQLDirective,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql'

export const GraphQLStreamDirective = new GraphQLDirective({
  name: 'stream',
  description:
    'Directs the executor to stream plural fields when the `if` argument is true or undefined.',
  locations: [DirectiveLocation.FIELD],
  args: {
    if: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Stream when true or undefined.',
      defaultValue: true,
    },
    label: {
      type: GraphQLString,
      description: 'Unique name',
    },
    initialCount: {
      defaultValue: 0,
      type: GraphQLInt,
      description: 'Number of items to return immediately',
    },
  },
})
