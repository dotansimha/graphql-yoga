import { startApp } from './app';

startApp(4000).catch(e => {
  console.error(e);
  process.exit(1);
});
