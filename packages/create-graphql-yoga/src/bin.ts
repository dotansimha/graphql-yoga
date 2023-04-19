import { createGraphQLYoga } from './index.js'

createGraphQLYoga().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
