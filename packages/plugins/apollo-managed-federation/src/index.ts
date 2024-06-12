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

  const plugin: Plugin = {
    onPluginInit({ setSchema }) {
      if (supergraphManager.schema) {
        setSchema(supergraphManager.schema);
      } else {
        // Wait for the first schema to be loaded before before allowing requests to be parsed
        // We can then remove the onRequestParse hook to avoid async cost on every request
        const waitForInitialization = new Promise<void>(resolve => {
          supergraphManager.once('schema', () => {
            plugin.onRequestParse = undefined;
            resolve();
          });
        });
        plugin.onRequestParse = async () => {
          await waitForInitialization;
        };
      }
      supergraphManager.on('schema', setSchema);
    },
  };

  return plugin;
}
