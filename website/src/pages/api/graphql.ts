import { createServer } from '@graphql-yoga/node'
import { renderGraphiQL } from '@graphql-yoga/render-graphiql'

const server = createServer({
  renderGraphiQL,
})

export default server
