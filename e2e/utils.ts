import { execSync } from 'child_process'
import { request } from 'undici'

export function getCommitId() {
  return (process.env.COMMIT_ID || execSync('git rev-parse --short HEAD'))
    .toString()
    .trim()
}

export async function waitForEndpoint(
  endpoint: string,
  retries: number,
  timeout: number = 10000,
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.info(
      `Trying to connect to ${endpoint} (attempt ${attempt}/${retries})...`,
    )
    try {
      await request(endpoint, {
        method: 'GET',
      })

      return true
    } catch (e) {
      console.warn(
        `Failed to connect to endpoint: ${endpoint}, waiting ${timeout}ms...`,
      )

      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }

  throw new Error(
    `Failed to connect to endpoint: ${endpoint} (attempts: ${retries})`,
  )
}

export function env(name: string): string {
  if (!process.env[name]) {
    throw new Error(`Environment variable ${name} not set`)
  }

  return process.env[name]
}

export async function assertGraphiQL(endpoint: string) {
  console.log(`ℹ️ Looking for valid Yoga GraphiQL in ${endpoint}...`)

  const { statusCode, body } = await request(endpoint, {
    method: 'GET',
    headers: {
      accept: 'text/html',
    },
  })

  if (statusCode !== 200) {
    console.warn(`⚠️ Invalid GraphiQL status code:`, statusCode)

    throw new Error(
      `Failed to locate GraphiQL: invalid status code (${statusCode})`,
    )
  }

  const html = await body.text()

  if (!html.includes('<title>Yoga GraphiQL</title>')) {
    console.warn(`⚠️ Invalid GraphiQL body:`, html)

    throw new Error(
      `Failed to locate GraphiQL: failed to find signs for GraphiQL HTML`,
    )
  }

  console.log(`\t✅ All good!`)
}

const DUMMY_QUERY = /* GraphQL */ `
  query {
    greetings
  }
`
const DUMMY_VARIABLES = {}

export async function assertQuery(
  endpoint: string,
  query: string = DUMMY_QUERY,
  variables: Record<string, any> = DUMMY_VARIABLES,
) {
  console.log(`ℹ️ Trying to run a GraphQL operation against ${endpoint}:`)
  console.log(`\t operation: ${query}`)
  console.log(`\t variables: ${JSON.stringify(variables, null, 2)}`)

  const { statusCode, body } = await request(endpoint, {
    method: 'POST',
    headers: {
      accept: 'applications/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (statusCode !== 200) {
    console.warn(`⚠️ Invalid GraphQL status code response:`, statusCode)

    throw new Error(
      `Failed to run GraphQL request, response error code is: ${statusCode}`,
    )
  }

  const responseJson = await body.json()

  if (responseJson.errors) {
    console.warn(`⚠️ Found GraphQL response with errors:`, responseJson.errors)

    throw new Error(
      `Failed to run GraphQL request, got a valid 200 response, but with GraphQL errors: ${JSON.stringify(
        responseJson.errors,
      )}`,
    )
  }

  if (query !== DUMMY_QUERY) {
    return responseJson
  }

  if (
    responseJson.data?.greetings !==
    'This is the `greetings` field of the root `Query` type'
  ) {
    console.warn(
      `⚠️ Unexpected GraphQL response content for default query:`,
      responseJson,
    )

    throw new Error(
      `Expected to find in respnse "data.greetings" with the correct content value`,
    )
  }

  console.log(`\t✅ All good!`)
}
