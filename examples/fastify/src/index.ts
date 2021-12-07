import { buildApp } from './app'

const app = buildApp()

app.listen(4000).then(() => {
    app.log.info('GraphQL server running at http://localhost:4000/graphql')
}).catch(err => {
    app.log.error(err)
    process.exit(1)
})