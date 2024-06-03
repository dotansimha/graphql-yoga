import type { Plugin } from 'graphql-yoga';
import { SupergraphSchemaManager, SupergraphSchemaManagerOptions } from '@graphql-tools/federation';

export type ManagedFederationPluginOptions = SupergraphSchemaManagerOptions;

export type Logger = {
  info: (message: string, ...args: unknown[]) => void;
  error: (message: string, error?: unknown, ...args: unknown[]) => void;
};

export function useManagedFederation(options: ManagedFederationPluginOptions = {}): Plugin {
  const supergraphManager = new SupergraphSchemaManager(options);

  // Start as soon as possible to minimize the wait time of the first schema loading
  supergraphManager.start();

  // Wait for the first schema to be loaded before before allowing requests to be parsing
  // We can then remove the onRequestParse hook to avoid async cost on every request
  const waitForInitialization = new Promise(resolve => {
    supergraphManager.on('schema', () => {
      plugin.onRequestParse = undefined;
      resolve(null);
    });
  });

  const plugin: Plugin = {
    onPluginInit({ setSchema }) {
      if (supergraphManager.schema) {
        setSchema(supergraphManager.schema);
      }
      supergraphManager.on('schema', setSchema);
    },
    async onRequestParse() {
      await waitForInitialization;
    },
  };

  return plugin;
}
