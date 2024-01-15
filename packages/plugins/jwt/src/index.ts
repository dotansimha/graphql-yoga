import { createGraphQLError, Plugin } from 'graphql-yoga';
import jsonwebtoken, { Algorithm, JwtPayload } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

const { decode } = jsonwebtoken;

export type JwtPluginOptions = JwtPluginOptionsWithJWKS | JwtPluginOptionsWithSigningKey;

export interface JwtPluginOptionsBase {
  /**
   * List of the algorithms used to verify the token
   *
   * Default: ["RS256"] (Allowed values: HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES384, ES512, PS256, PS384, PS512, none)
   */
  algorithms?: Algorithm[];
  /**
   * The audience is the identifier of the API and is forwarded to your Auth API in order to specify for which API we are trying to authenticate our user for. E.g. if our API is hosted on `http://localhost:3000/graphql`, we would pass that value.
   */
  audience?: string;
  /**
   * For example: `https://myapp.auth0.com/`
   */
  issuer: string;
  /**
   * Once a user got successfully authenticated the authentication information is added on the context object under this field. In our resolvers we can then access the authentication information via `context._jwt.sub`.
   */
  extendContextField?: string;
  /**
   * Function to extract the token from the request object
   *
   * Default: Extracts the token from the Authorization header with the format `Bearer <token>`
   */
  getToken?: (params: {
    request: Request;
    serverContext: object | undefined;
    url: URL;
  }) => Promise<string | undefined> | string | undefined;
}

export interface JwtPluginOptionsWithJWKS extends JwtPluginOptionsBase {
  /**
   * The endpoint to fetch keys from.
   *
   * For example: https://example.com/.well-known/jwks.json
   */
  jwksUri: string;
  signingKey?: never;
}

export interface JwtPluginOptionsWithSigningKey extends JwtPluginOptionsBase {
  /**
   * Signing key to be used to verify the token
   * You can also use the jwks option to fetch the key from a JWKS endpoint
   */
  signingKey: string;
  jwksUri?: never;
}

export function useJWT(options: JwtPluginOptions): Plugin {
  if (!options.signingKey && !options.jwksUri) {
    throw new TypeError('You need to provide either a signingKey or a jwksUri');
  }

  if (options.signingKey && options.jwksUri) {
    throw new TypeError('You need to provide either a signingKey or a jwksUri, not both');
  }

  const { extendContextField = 'jwt', getToken = defaultGetToken } = options;

  const payloadByRequest = new WeakMap<Request, JwtPayload | string>();

  let jwksClient: JwksClient;
  const jwksCache: Map<string, string> = new Map();

  if (options.jwksUri) {
    jwksClient = new JwksClient({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: options.jwksUri,
    });
  }

  return {
    async onRequestParse({ request, serverContext, url }) {
      const token = await getToken({ request, serverContext, url });
      if (token != null) {
        const signingKey = options.signingKey ?? (await fetchKey(jwksClient, jwksCache, token));

        const verified = await verify(token, signingKey, options);

        if (!verified) {
          throw unauthorizedError(`Unauthenticated`);
        }

        payloadByRequest.set(request, verified);
      }
    },
    onContextBuilding({ context, extendContext }) {
      if (context.request == null) {
        throw new Error(
          'Request is not available on context! Make sure you use this plugin with GraphQL Yoga.',
        );
      }
      const payload = payloadByRequest.get(context.request);
      if (payload != null) {
        extendContext({
          [extendContextField]: payload,
        });
      }
    },
  };
}

function unauthorizedError(message: string, options?: Parameters<typeof createGraphQLError>[1]) {
  return createGraphQLError(message, {
    extensions: {
      http: {
        status: 401,
      },
    },
    ...options,
  });
}

function verify(
  token: string,
  signingKey: string,
  options: Parameters<typeof jsonwebtoken.verify>[2],
) {
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(
      token,
      signingKey,
      { ...options, algorithms: options?.algorithms ?? ['RS256'] },
      (err, result) => {
        if (err) {
          reject(unauthorizedError('Failed to decode authentication token. Verification failed.'));
        } else {
          resolve(result as JwtPayload);
        }
      },
    );
  });
}

async function fetchKey(jwksClient: JwksClient, jwksCache: Map<string, string>, token: string): Promise<string> {
  const decodedToken = decode(token, { complete: true });
  if (decodedToken?.header?.kid == null) {
    throw unauthorizedError(`Failed to decode authentication token. Missing key id.`);
  }

  if (!jwksCache.has(decodedToken.header.kid)) {
    const secret = await jwksClient.getSigningKey(decodedToken.header.kid);
    const signingKey = secret?.getPublicKey();
    if (!signingKey) {
      throw unauthorizedError(`Failed to decode authentication token. Unknown key id.`);
    }
    jwksCache.set(decodedToken.header.kid, signingKey);
  }

  return jwksCache.get(decodedToken.header.kid)!;
}

const defaultGetToken: NonNullable<JwtPluginOptions['getToken']> = ({ request }) => {
  const header = request.headers.get('authorization');
  if (!header) {
    return;
  }
  const [type, token] = header.split(' ');
  if (type !== 'Bearer') {
    throw unauthorizedError(`Unsupported token type provided: "${type}"`);
  }
  return token;
};
