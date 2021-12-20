const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const createSchema = require('./schema')

const app = express()

app.use(
  '/graphql',
  graphqlHTTP({
    schema: createSchema({
      stop: () => new Promise((resolve) => server.close(resolve)),
    }),
  }),
)

const server = app.listen(4000)
