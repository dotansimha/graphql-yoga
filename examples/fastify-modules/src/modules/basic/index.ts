import { createModule } from 'graphql-modules'
import { join } from 'path'
import { loadFilesSync } from '@graphql-tools/load-files'
import { resolvers } from './resolvers'
import { BasicProvider } from './providers'

export const basicModule = createModule({
  id: 'basic',
  dirname: __dirname,
  typeDefs: loadFilesSync(join(__dirname, './typeDefs/*.graphql')),
  resolvers,
  providers: () => [BasicProvider],
})
