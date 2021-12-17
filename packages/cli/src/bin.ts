import { graphqlYoga } from '.'

try {
  graphqlYoga()
} catch (e) {
  console.error(e)
  process.exit(1)
}
