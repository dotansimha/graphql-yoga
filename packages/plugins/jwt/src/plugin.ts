import type { Plugin, YogaLogger } from 'graphql-yoga';
import jsonwebtoken, { type Jwt, type JwtPayload, type VerifyOptions } from 'jsonwebtoken';
import { type OnRequestParseEventPayload } from 'packages/graphql-yoga/src/plugins/types.js';
import { normalizeConfig, type JwtPluginOptions } from './config.js';
import '@whatwg-node/server-plugin-cookies';
import { GraphQLError } from 'graphql';
import { badRequestError, unauthorizedError } from './utils.js';

export type JWTExtendContextFields = {
  payload: JwtPayload;
  token: {
    value: string;
    prefix?: string;
  };
};

export function useJWT(options: JwtPluginOptions): Plugin<{
  jwt?: JWTExtendContextFields;
}> {
  let logger: YogaLogger;
  const normalizedOptions = normalizeConfig(options);
  const payloadByRequest = new WeakMap<
    Request,
    {
      payload: JwtPayload;
      token: {
        value: string;
        prefix?: string;
      };
    }
  >();
  const lookupToken = async (payload: OnRequestParseEventPayload<object>) => {
    for (const lookupLocation of normalizedOptions.tokenLookupLocations) {
      const token = await lookupLocation(payload);

      if (token) {
        return token;
      }
    }

    return null;
  };

  const getSigningKey = async (kid?: string) => {
    for (const provider of normalizedOptions.signingKeyProviders) {
      try {
        const key = await provider(kid);

        if (key) {
          return key;
        }
      } catch (e) {
        logger.error(`Failed to fetch signing key from signing provided:`, e);
      }
    }

    return null;
  };

  return {
    onYogaInit({ yoga }) {
      logger = yoga.logger;
    },
    async onRequestParse(payload) {
      // Try to find token in request, and reject the request if needed.
      const lookupResult = await lookupToken(payload);

      if (!lookupResult) {
        // If token is missing, we can reject the request based on the configuration.
        if (normalizedOptions.reject.missingToken) {
          logger.debug(`Token is missing in incoming HTTP request, JWT plugin failed to locate.`);
          throw unauthorizedError(`Unauthenticated`);
        }

        return;
      }

      try {
        // Decode the token first, in order to get the key id to use.
        let decodedToken: Jwt | null;
        try {
          decodedToken = jsonwebtoken.decode(lookupResult.token, { complete: true });
        } catch (e) {
          logger.warn(`Failed to decode JWT authentication token: `, e);
          throw badRequestError(`Invalid authentication token provided`);
        }

        if (!decodedToken) {
          logger.warn(
            `Failed to extract payload from incoming token, please make sure the token is a valid JWT.`,
          );

          throw badRequestError(`Invalid authentication token provided`);
        }

        // Fetch the signing key based on the key id.
        const signingKey = await getSigningKey(decodedToken?.header.kid);

        if (!signingKey) {
          logger.warn(
            `Signing key is not available for the key id: ${decodedToken?.header.kid}. Please make sure signing key providers are configured correctly.`,
          );

          throw Error(`Authentication is not available at the moment.`);
        }

        // Verify the token with the signing key.
        const verified = await verify(
          logger,
          lookupResult.token,
          signingKey,
          normalizedOptions.tokenVerification,
        );

        if (!verified) {
          logger.debug(`Token failed to verify, JWT plugin failed to authenticate.`);
          throw unauthorizedError(`Unauthenticated`);
        }

        if (verified) {
          // Link the verified payload with the request (see `onContextBuilding` for the reading part)
          payloadByRequest.set(payload.request, {
            payload: verified,
            token: {
              value: lookupResult.token,
              prefix: lookupResult.prefix,
            },
          });
        }
      } catch (e) {
        // User-facing errors should be handled based on the configuration.
        // These errors are handled based on the value of "reject.invalidToken" config.
        if (e instanceof GraphQLError) {
          if (normalizedOptions.reject.invalidToken) {
            throw e;
          }

          return;
        }

        // Server/internal errors should be thrown, so they can be handled by the error handler and be masked.
        throw e;
      }
    },
    onContextBuilding({ context, extendContext }) {
      if (normalizedOptions.extendContextFieldName === null) {
        return;
      }

      if (context.request == null) {
        throw new Error(
          'Request is not available on context! Make sure you use this plugin with GraphQL Yoga.',
        );
      }

      // Get the payload and inject it into the GraphQL context.
      const result = payloadByRequest.get(context.request);
      if (result && normalizedOptions.extendContextFieldName) {
        extendContext({
          [normalizedOptions.extendContextFieldName]: {
            payload: result.payload,
            token: result.token,
          },
        });
      }
    },
  };
}

function verify(
  logger: YogaLogger,
  token: string,
  signingKey: string,
  options: VerifyOptions | undefined,
) {
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, signingKey, options, (err, result) => {
      if (err) {
        logger.warn(`Failed to verify authentication token: `, err);
        reject(unauthorizedError('Unauthenticated'));
      } else {
        resolve(result as JwtPayload);
      }
    });
  });
}
