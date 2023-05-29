import * as path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
      '/graphql': 'http://localhost:4000',
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src', 'bundle.tsx'),
      name: 'YogaGraphiQL',
      fileName: (format) => `yoga-graphiql.${format}.js`,
    },
    rollupOptions: {
      output: {
        /** prevent code-splitting */
        inlineDynamicImports: false,
        manualChunks: () => '_.js',
      },
    },
  },
})
