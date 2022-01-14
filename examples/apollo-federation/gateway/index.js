const { createServer } = require('graphql-yoga')
const { ApolloGateway } = require('@apollo/gateway')
const { useApolloFederation } = require('@envelop/apollo-federation')

async function main() {
  // Initialize the gateway
  const gateway = new ApolloGateway({
    serviceList: [
      { name: 'accounts', url: 'http://localhost:4001' },
      // ...additional subgraphs...
    ],
  })

  // Make sure all services are loaded
  await gateway.load()

  const server = createServer({
    schema: gateway.schema,
    plugins: [
      useApolloFederation({
        gateway,
      }),
    ],
  })

  // Start the server and explore http://localhost:4000/graphql
  await server.start()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
