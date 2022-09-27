import { buildApp } from './app'

const app = buildApp()

app
  .listen({
    port: 4000,
  })
  .then((serverUrl) => {
    app.log.info(`GraphQL API located at ${serverUrl}/graphql`)
  })
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
