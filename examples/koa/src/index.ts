import { buildApp } from './app';

const app = buildApp();

app.listen(4000, () => {
  console.log('GraphQL API located at http://localhost:4000');
});
