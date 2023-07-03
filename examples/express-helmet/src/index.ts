import express from 'express'
import { buildApp } from './app'

const app = express()

const endpoint = buildApp(app)

app.listen(4000, () => {
  console.log(`GraphQL API located at http://localhost:4000${endpoint}`)
})
