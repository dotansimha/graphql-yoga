#!/usr/bin/env node
import { createGraphQLYoga, spinner } from './index.js'
import { fetch } from '@whatwg-node/fetch'

createGraphQLYoga({
  argv: process.argv,
  input: process.stdin,
  output: process.stdout,
  fetchFn: fetch,
}).catch((e) => {
  spinner.fail(e.message)
  process.exit(1)
})
