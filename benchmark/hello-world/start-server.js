const { createServer, useSchema } = require('@graphql-yoga/node')
const { buildSchema, execute } = require('graphql')

const server = createServer({
  logging: false,
  hostname: '127.0.0.1',
  plugins: [
    useSchema(buildSchema('type Query { greetings: String! }')),
    {
      onExecute({ setExecuteFn }) {
        setExecuteFn((args) =>
          execute({
            ...args,
            rootValue: {
              greetings:
                'This is the `greetings` field of the root `Query` type',
            },
          }),
        )
      },
    },
  ],
})

server.start()
