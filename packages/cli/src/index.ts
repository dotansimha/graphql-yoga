import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { GraphQLExtensionDeclaration, loadConfig } from 'graphql-config'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { GraphQLServer } from 'graphql-yoga'

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
  return yargs(hideBin(process.argv)).command<{ project: string }>(
    '$0',
    'Serves GraphQL over HTTP using your GraphQL Config',
    (builder) => {
      builder.option('project', {
        type: 'string',
        description: 'Project name',
      })
    },
    async ({ project = 'default' }) => {
      console.info(`Loading GraphQL Config from ${process.cwd()}`)
      const config = await loadConfig({
        extensions: [YogaExtensions],
      })
      console.log(`Loading project: ${project}`)
      const projectConfig = config?.getProject(project)
      console.log(`Loading GraphQL Schema of ${project}`)
      const schema = await projectConfig?.getSchema()
      if (!schema) {
        throw new Error(`Could not find schema for project ${project}`)
      }
      console.log(`Building GraphQL Server`)
      const graphQLServer = new GraphQLServer({
        schema,
      })
      console.log(`Starting GraphQL Server`)
      await graphQLServer.start()

      registerTerminateHandler(() => {
        graphQLServer.stop()
      })
    },
  ).argv
}
