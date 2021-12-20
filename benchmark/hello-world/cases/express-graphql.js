const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const createSchema = require('./schema')

const app = express()

app.use(
  '/graphql',
  graphqlHTTP({
    schema: createSchema({
      stop: () => server.close(),
    }),
  }),
)

const server = app.listen(4000)
