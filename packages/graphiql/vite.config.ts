import * as path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // fastRefresh: false,
    }),
  ],
  server: {
    port: 4001,
    proxy: {
      '/graphql': 'http://localhost:4000/graphql',
    },
  },
  define:
    // Having this environment variable set in development will break the dev server
    process.env.BUILD === 'true'
      ? {
          'process.env.NODE_ENV': '"production"',
        }
      : undefined,
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src', 'bundle.tsx'),
      name: 'YogaGraphiQL',
      fileName: format => `yoga-graphiql.${format}.js`,
    },
    rollupOptions: {
      output: {
        /** prevent code-splitting */
        inlineDynamicImports: false,
        manualChunks: () => '_.js',
      },
    },
  },
});
