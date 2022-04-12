import { server } from './server.mjs'

server.start().catch((e) => {
  console.error(e)
  process.exit(1)
})
