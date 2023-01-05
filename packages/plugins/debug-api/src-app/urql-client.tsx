import { createClient } from 'urql'

const g = globalThis as any

if (!g.__yogaDebugApi) {
  console.warn(
    `Yoga Debug API configuration not found. Using default configuration for local development.`,
  )

  const defaultConfig = {
    graphqlEndpoint: 'http://localhost:4000/__debug/graphql',
  }

  g.__yogaDebugApi = defaultConfig
}

export const client = createClient({
  url: g.__yogaDebugApi.graphqlEndpoint,
})
