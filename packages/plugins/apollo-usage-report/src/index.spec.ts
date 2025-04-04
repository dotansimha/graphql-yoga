import { createYoga, Plugin } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { useApolloUsageReport } from '../src';

const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  text: () => Promise.resolve('{"success":true}'),
});

const mockCrypto = {
  subtle: {
    digest: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  },
};

class MockTextEncoder {
  encode() {
    return new Uint8Array([1, 2, 3, 4]);
  }
}

const createTestSchema = (includeWorldField = false) => {
  return makeExecutableSchema({
    typeDefs: `
      type Query {
        hello: String
        ${includeWorldField ? 'world: String' : ''}
      }
    `,
  });
};

const setupPluginAndGetInternalPlugins = (options = {}) => {
  const apolloPlugin = useApolloUsageReport({
    endpoint: 'http://test-endpoint.com',
    ...options,
  });

  const addedPlugins: Plugin[] = [];
  const pluginInit = apolloPlugin.onPluginInit as (args: {
    addPlugin: (plugin: Plugin) => void;
  }) => void;
  pluginInit({ addPlugin: plugin => addedPlugins.push(plugin) });

  return {
    apolloPlugin,
    addedPlugins,
    schemaChangePlugin: addedPlugins.find(plugin => 'onSchemaChange' in plugin),
    yogaInitPlugin: addedPlugins.find(plugin => 'onYogaInit' in plugin),
    requestParsePlugin: addedPlugins.find(plugin => 'onRequestParse' in plugin),
    resultProcessPlugin: addedPlugins.find(plugin => 'onResultProcess' in plugin),
  };
};

// @ts-expect-error: ??
const createTestYoga = (apolloPlugin, schema, fetchImpl = mockFetch, logger = undefined) => {
  return createYoga({
    schema,
    plugins: [apolloPlugin],
    fetchAPI: {
      fetch: fetchImpl,
      crypto: mockCrypto as unknown as Crypto,
      TextEncoder: MockTextEncoder as unknown as typeof TextEncoder,
    },
    ...(logger ? { logging: logger } : {}),
  });
};

describe('useApolloUsageReport plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env['APOLLO_KEY'] = 'test-api-key';
    process.env['APOLLO_GRAPH_REF'] = 'test-graph-ref';
  });

  afterEach(() => {
    delete process.env['APOLLO_KEY'];
    delete process.env['APOLLO_GRAPH_REF'];
  });

  test('should correctly handle schema change before Yoga initialization', async () => {
    const { apolloPlugin, schemaChangePlugin, yogaInitPlugin, requestParsePlugin } =
      setupPluginAndGetInternalPlugins();

    if (!schemaChangePlugin || !('onSchemaChange' in schemaChangePlugin)) {
      throw new Error('Plugin with onSchemaChange not found');
    }

    if (!yogaInitPlugin || !('onYogaInit' in yogaInitPlugin)) {
      throw new Error('Plugin with onYogaInit not found');
    }

    if (!requestParsePlugin || !('onRequestParse' in requestParsePlugin)) {
      throw new Error('Plugin with onRequestParse not found');
    }

    const initialSchema = createTestSchema();
    const updatedSchema = createTestSchema(true);

    // @ts-expect-error: ??
    schemaChangePlugin.onSchemaChange!({ schema: updatedSchema });

    const yoga = createTestYoga(apolloPlugin, initialSchema);

    yogaInitPlugin.onYogaInit!({ yoga });

    // @ts-expect-error: ??
    await requestParsePlugin.onRequestParse!();

    expect(mockCrypto.subtle.digest).toHaveBeenCalled();
  });

  test('should correctly handle schema change after Yoga initialization', async () => {
    const { apolloPlugin, schemaChangePlugin, yogaInitPlugin } = setupPluginAndGetInternalPlugins();

    if (!schemaChangePlugin || !('onSchemaChange' in schemaChangePlugin)) {
      throw new Error('Plugin with onSchemaChange not found');
    }

    if (!yogaInitPlugin || !('onYogaInit' in yogaInitPlugin)) {
      throw new Error('Plugin with onYogaInit not found');
    }

    const initialSchema = createTestSchema();
    const updatedSchema = createTestSchema(true);

    const yoga = createTestYoga(apolloPlugin, initialSchema);

    yogaInitPlugin.onYogaInit!({ yoga });

    mockCrypto.subtle.digest.mockClear();

    // @ts-expect-error: ??
    schemaChangePlugin.onSchemaChange!({ schema: updatedSchema });

    expect(mockCrypto.subtle.digest).toHaveBeenCalled();
  });

  test('should correctly handle schema change through event', async () => {
    const { apolloPlugin, schemaChangePlugin } = setupPluginAndGetInternalPlugins();

    if (!schemaChangePlugin || !('onSchemaChange' in schemaChangePlugin)) {
      throw new Error('Plugin with onSchemaChange not found');
    }

    const initialSchema = createTestSchema();
    const updatedSchema = createTestSchema(true);

    const yoga = createTestYoga(apolloPlugin, initialSchema);

    mockCrypto.subtle.digest.mockClear();

    // @ts-expect-error: ??
    schemaChangePlugin.onSchemaChange!({ schema: updatedSchema });

    await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ hello }',
      }),
    });

    expect(mockCrypto.subtle.digest).toHaveBeenCalled();
  });

  test('should throw error when API key is missing', () => {
    delete process.env['APOLLO_KEY'];

    const schema = createTestSchema();

    const apolloPlugin = useApolloUsageReport({
      endpoint: 'http://test-endpoint.com',
    });

    expect(() => {
      createTestYoga(apolloPlugin, schema);
    }).toThrow('[ApolloUsageReport] Missing API key');
  });

  test('should throw error when Graph Ref is missing', () => {
    delete process.env['APOLLO_GRAPH_REF'];

    const schema = createTestSchema();

    const apolloPlugin = useApolloUsageReport({
      endpoint: 'http://test-endpoint.com',
      apiKey: 'test-api-key',
    });

    expect(() => {
      createTestYoga(apolloPlugin, schema);
    }).toThrow('[ApolloUsageReport] Missing Graph Ref');
  });

  test('should correctly use logger when trace sending fails', async () => {
    const schema = createTestSchema();

    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    const errorFetch = jest.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('{"error":"Trace sending error"}'),
    });

    const apolloPlugin = useApolloUsageReport({
      endpoint: 'http://test-endpoint.com',
    });

    // @ts-expect-error: ??
    const yoga = createTestYoga(apolloPlugin, schema, errorFetch, mockLogger);

    await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ hello }',
      }),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[ApolloUsageReport]',
      'Failed to send trace:',
      '{"error":"Trace sending error"}',
    );
  });
});
