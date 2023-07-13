import { join } from 'node:path';
import { createModule } from 'graphql-modules';
import { loadFilesSync } from '@graphql-tools/load-files';
import { BasicProvider } from './providers';
import { resolvers } from './resolvers';

export const basicModule = createModule({
  id: 'basic',
  dirname: __dirname,
  typeDefs: loadFilesSync(join(__dirname, './typeDefs/*.graphql')),
  resolvers,
  providers: () => [BasicProvider],
});
