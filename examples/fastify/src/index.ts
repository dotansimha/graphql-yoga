import { buildApp } from './app';

const [app, endpoint] = buildApp(true);

app
  .listen({
    port: 4000,
  })
  .then(serverUrl => {
    app.log.info(`GraphQL API located at ${serverUrl}${endpoint}`);
  })
  .catch(err => {
    app.log.error(err);
    process.exit(1);
  });
