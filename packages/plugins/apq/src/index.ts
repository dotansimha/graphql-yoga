import { createGraphQLError, createLRUCache, Plugin, PromiseOrValue } from 'graphql-yoga';

export async function hashSHA256(
  str: string,
  api: {
    crypto: Crypto;
    TextEncoder: (typeof globalThis)['TextEncoder'];
  } = globalThis,
) {
  const { crypto, TextEncoder } = api;
  const textEncoder = new TextEncoder();
  const utf8 = textEncoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  let hashHex = '';
  for (const bytes of new Uint8Array(hashBuffer)) {
    hashHex += bytes.toString(16).padStart(2, '0');
  }
  return hashHex;
}

export interface APQStoreOptions {
  max?: number;
  ttl?: number;
}

export function createInMemoryAPQStore(options: APQStoreOptions = {}): APQStore {
  return createLRUCache<string>({
    max: options.max ?? 1000,
    ttl: options.ttl ?? 36_000,
  });
}

export interface APQOptions {
  store?: APQStore;
  hash?: (
    str: string,
    api: { crypto: Crypto; TextEncoder: typeof TextEncoder },
  ) => PromiseOrValue<string>;
  responseConfig?: {
    /**
     * If true, the status code of the response (if the query
     * is not found or mismatched) will be 200.
     */
    forceStatusCodeOk?: boolean;
  };
}

export interface APQStore {
  get(key: string): PromiseOrValue<string | null | undefined>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, query: string): PromiseOrValue<any>;
}

export interface APQExtension {
  version: 1;
  sha256Hash: string;
}

function isAPQExtension(input: unknown): input is APQExtension {
  return (
    input != null &&
    typeof input === 'object' &&
    'version' in input &&
    input?.version === 1 &&
    'sha256Hash' in input &&
    typeof input?.sha256Hash === 'string'
  );
}

function decodeAPQExtension(
  input: Record<string, unknown> | null | undefined,
): null | APQExtension {
  if (isAPQExtension(input)) {
    return input as APQExtension;
  }
  return null;
}

export function useAPQ(options: APQOptions = {}): Plugin {
  const { store = createInMemoryAPQStore(), hash = hashSHA256, responseConfig = {} } = options;

  return {
    async onParams({ params, setParams, fetchAPI }) {
      const persistedQueryData = decodeAPQExtension(params.extensions?.persistedQuery);

      if (persistedQueryData === null) {
        return;
      }

      if (params.query == null) {
        const persistedQuery = await store.get(persistedQueryData.sha256Hash);
        if (persistedQuery == null) {
          throw createGraphQLError('PersistedQueryNotFound', {
            extensions: {
              http: {
                status: responseConfig.forceStatusCodeOk ? 200 : 404,
              },
              code: 'PERSISTED_QUERY_NOT_FOUND',
            },
          });
        }
        setParams({
          ...params,
          query: persistedQuery,
        });
      } else {
        const expectedHash = await hash(params.query, fetchAPI);
        if (persistedQueryData.sha256Hash !== expectedHash) {
          throw createGraphQLError('PersistedQueryMismatch', {
            extensions: {
              http: {
                status: responseConfig.forceStatusCodeOk ? 200 : 400,
              },
              code: 'PERSISTED_QUERY_MISMATCH',
            },
          });
        }
        await store.set(persistedQueryData.sha256Hash, params.query);
      }
    },
  };
}
