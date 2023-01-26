import { createServer } from 'http'
import { buildService, gateway } from './gateway'

async function main() {
  const yoga = await gateway({
    serviceList: [
      { name: 'accounts', url: 'http://localhost:4001/graphql' },
      // ...additional subgraphs...
    ],
    buildService,
  })

  // Start the server and explore http://localhost:4000/graphql
  const server = createServer(yoga)
  server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/graphql')
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
