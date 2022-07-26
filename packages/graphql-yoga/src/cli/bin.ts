#!/usr/bin/env node
import { graphqlYoga } from './index.js'

try {
  graphqlYoga()
} catch (e) {
  console.error(e)
  process.exit(1)
}
