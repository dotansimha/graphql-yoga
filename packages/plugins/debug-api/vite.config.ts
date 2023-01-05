import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  build: {
    outDir: './dist-app',
    minify: 'terser',
    terserOptions: {
      mangle: true,
      compress: true,
      output: {
        beautify: true,
      },
    },
  },
  plugins: [
    react(),
    viteSingleFile({ removeViteModuleLoader: true, deleteInlinedFiles: true }),
    {
      name: 'variable-output',
      enforce: 'post',
      generateBundle: (_, bundle) => {
        const rootAsset = bundle['index.html']

        if (rootAsset.type === 'asset') {
          bundle['../src/app.ts'] = {
            fileName: '../src/app.ts',
            type: 'asset',
            name: 'out.ts',
            source: `export const APP_HTML = \`
${(rootAsset.source as string)
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$')}\`
`,
          }
        }
      },
    },
  ],
})
