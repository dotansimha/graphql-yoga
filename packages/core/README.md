# `@graphql-yoga`

```js
const {
  GraphQLServer,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} = require('../core/dist')

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      song: {
        type: new GraphQLObjectType({
          name: 'Song',
          fields: () => ({
            firstVerse: {
              type: GraphQLString,
              resolve: (_, __, { logger }) => {
                logger.info('I can even use the same logger!')
                return "Now I know my ABC's."
              },
            },
            secondVerse: {
              type: GraphQLString,
              resolve: () =>
                new Promise((resolve) =>
                  setTimeout(
                    () => resolve("Next time won't you sing with me?"),
                    5000,
                  ),
                ),
            },
          }),
        }),
        resolve: () => ({}),
      },
    }),
  }),
})

const server = new GraphQLServer({ schema })
server.start()
```
