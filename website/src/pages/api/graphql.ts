import { createYoga } from 'graphql-yoga'
import { renderGraphiQL } from '@graphql-yoga/render-graphiql'

const yoga = createYoga({
  renderGraphiQL,
})

export default yoga
