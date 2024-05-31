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

  return {
    onPluginInit({ setSchema }) {
      if (supergraphManager.schema) {
        setSchema(supergraphManager.schema);
      }
      supergraphManager.onSchemaChange = setSchema;
    },
    onRequestParse() {
      return supergraphManager.waitForInitialization();
    },
  };
}
