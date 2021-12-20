const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const schema = require('./schema')

const app = express()

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
  }),
)

app.listen(4000)
