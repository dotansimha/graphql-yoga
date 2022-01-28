import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],

  server: {
    port: 4001,
    proxy: {
      '/graphql': 'http://localhost:4000',
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        manualChunks: undefined,
      },
    },
  },
})
