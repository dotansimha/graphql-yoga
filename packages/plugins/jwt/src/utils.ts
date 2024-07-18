import { createGraphQLError } from 'graphql-yoga';
import { JwksClient, type Options as JwksClientOptions } from 'jwks-rsa';
import { GetSigningKeyFunction, type ExtractTokenFunction } from './config.js';

export function extractFromHeader(options: {
  name: string;
  prefix?: string;
}): ExtractTokenFunction {
  return ({ request }) => {
    const header = request.headers.get(options.name);

    if (header == null) {
      return;
    }

    if (!options.prefix) {
      const parts = header.split(' ').map(s => s.trim());

      if (parts.length === 1) {
        return {
          prefix: undefined,
          token: parts[0],
        };
      }

      return {
        prefix: parts[0],
        token: parts[1],
      };
    }

    const [prefix, token] = header.split(' ').map(s => s.trim());

    if (prefix !== options.prefix) {
      throw badRequestError(`Invalid JWT authentication token prefix.`);
    }

    if (!token) {
      throw badRequestError(`Authentication header was set, but token is missing.`);
    }

    return {
      token,
      prefix,
    };
  };
}

export function extractFromCookie(options: { name: string }): ExtractTokenFunction {
  return async ({ request }) => {
    const cookieStore = request.cookieStore;

    if (!cookieStore) {
      throw new Error(
        'Cookie store is not available on request. Please make sure to configure the cookie plugin.',
      );
    }

    const cookie = await cookieStore.get(options.name);

    if (!cookie) {
      return undefined;
    }

    return {
      prefix: undefined,
      token: cookie.value,
    };
  };
}

export function badRequestError(
  message: string,
  options?: Parameters<typeof createGraphQLError>[1],
) {
  return createGraphQLError(message, {
    extensions: {
      http: {
        status: 400,
      },
    },
    ...options,
  });
}

export function unauthorizedError(
  message: string,
  options?: Parameters<typeof createGraphQLError>[1],
) {
  return createGraphQLError(message, {
    extensions: {
      http: {
        status: 401,
      },
    },
    ...options,
  });
}

export function createInlineSigningKeyProvider(signingKey: string): GetSigningKeyFunction {
  return () => signingKey;
}

export function createRemoteJwksSigningKeyProvider(
  jwksClientOptions: JwksClientOptions,
): GetSigningKeyFunction {
  const client = new JwksClient(jwksClientOptions);

  return kid => client.getSigningKey(kid)?.then(r => r.getPublicKey());
}
