import { defineConfig, configDefaults } from 'vitest/config';
import tsconfig from './tsconfig.json';

export default defineConfig({
  test: {
    globals: true,
    // resolveSnapshotPath: testPath =>
    //   testPath.replace('tests/', 'tests/__snapshots__/').replace(/\.ts$/, '.md'),
    // setupFiles: ['./serializer.js'],
    // @ts-expect-error -- It just works
    alias: tsconfig.compilerOptions.paths,
    exclude: [...configDefaults.exclude, '**/.bob/**']
  },
});
