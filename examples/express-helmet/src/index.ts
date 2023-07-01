import express from 'express'
import helmet from 'helmet'
import { buildApp } from './app'

const app = express()

const endpoint = buildApp(app)

// Global CSP configuration
app.use(helmet())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(4000, () => {
  console.log(`GraphQL API located at http://localhost:4000${endpoint}`)
})
