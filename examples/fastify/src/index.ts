import { buildApp } from './app'

const app = buildApp()

app.listen(4000).then(serverUrl => {
    app.log.info(`GraphQL server running at ${serverUrl}/graphql`)
}).catch(err => {
    app.log.error(err)
    process.exit(1)
})