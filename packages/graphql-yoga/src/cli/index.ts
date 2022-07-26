import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { GraphQLExtensionDeclaration, loadConfig } from 'graphql-config'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { createYoga } from 'graphql-yoga'
import { createServer } from 'http'
import { addMocksToSchema } from '@graphql-tools/mock'

const terminateEvents = ['SIGINT', 'SIGTERM']

function registerTerminateHandler(callback: (eventName: string) => void) {
  for (const eventName of terminateEvents) {
    process.on(eventName, () => callback(eventName))
  }
}

export const YogaExtensions: GraphQLExtensionDeclaration = (api) => {
  const codeFileLoader = new CodeFileLoader({
    noPluck: true,
  })
  api.loaders.schema.register(codeFileLoader)
  api.loaders.documents.register(codeFileLoader)
  return {
    name: 'Yoga',
  }
}

export function graphqlYoga() {
  return yargs(hideBin(process.argv)).command<{
    project: string
    mock: boolean
  }>(
    '$0',
    'Serves GraphQL over HTTP using your GraphQL Config',
    (builder) => {
      builder.option('project', {
        type: 'string',
        description: 'Project name',
      })
      builder.option('mock', {
        type: 'boolean',
        description: 'Mock the given schema',
      })
    },
    async ({ project = 'default', mock }) => {
      console.info(`Loading GraphQL Config from ${process.cwd()}`)
      const config = await loadConfig({
        extensions: [YogaExtensions],
        throwOnMissing: false,
        throwOnEmpty: false,
      })
      console.log(`Loading project: ${project}`)
      const projectConfig = config?.getProject(project)
      console.log(`Loading GraphQL Schema of ${project}`)
      let schema = await projectConfig?.getSchema()
      if (!schema) {
        console.warn(
          `Could not find schema for project ${project} fallback to default schema`,
        )
      }
      if (mock) {
        if (!schema) {
          console.warn('No schema found for mocking. Skipping mocking.')
        } else {
          console.log(`Adding mocks to the schema`)
          schema = addMocksToSchema({ schema })
        }
      }
      console.log(`Building GraphQL Server`)
      const yoga = createYoga({
        schema,
      })
      const server = createServer(yoga)
      console.log(`Starting GraphQL Server`)
      server.listen(4000)

      registerTerminateHandler(() => {
        server.close()
      })
    },
  ).argv
}

export * from 'graphql-yoga'
