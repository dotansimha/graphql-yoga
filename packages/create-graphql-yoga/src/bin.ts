import { createGraphQLYoga, spinner } from './index.js'

createGraphQLYoga().catch((e) => {
  spinner.fail(e.message)
  process.exit(1)
})
