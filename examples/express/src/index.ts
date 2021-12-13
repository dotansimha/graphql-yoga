import { buildApp } from './app'

const app = buildApp()

app.listen(4000, () => {
    console.log('GraphQL server running at http://localhost:4000/graphql')
})