import { JwksClient } from 'jwks-rsa'
import jsonwebtoken, { JwtPayload, Algorithm } from 'jsonwebtoken'
import { Plugin, createGraphQLError } from 'graphql-yoga'

const { decode } = jsonwebtoken

export interface JwtPluginOptions {
  /**
   * The endpoint to fetch keys from.
   *
   * For example: https://example.com/.well-known/jwks.json
   */
  jwksUri?: string
  /**
   * Signing key to be used to verify the token
   * You can also use the jwks option to fetch the key from a JWKS endpoint
   */
  signingKey?: string
  /**
   * List of the algorithms used to verify the token
   *
   * Default: ["HS256"] (Allowed values: HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES384, ES512, PS256, PS384, PS512, none)
   */
  algorithms?: Algorithm[]
  /**
   * The audience is the identifier of the API and is forwarded to your Auth API in order to specify for which API we are trying to authenticate our user for. E.g. if our API is hosted on `http://localhost:3000/graphql`, we would pass that value.
   */
  audience?: string
  /**
   * For example: `https://myapp.auth0.com/`
   */
  issuer: string
  /**
   * Once a user got successfully authenticated the authentication information is added on the context object under this field. In our resolvers we can then access the authentication information via `context._jwt.sub`.
   */
  extendContextField?: string
  /**
   * The name of the header to be used to extract the token from.
   *
   * Default: "Authorization"
   */
  headerName?: string
  /**
   * The type of the header
   *
   * Default: Bearer
   */
  headerType?: string
  /**
   * Function to extract the token from the request object
   *
   * Default: (request) => request.headers[headerName]
   */
  getToken?: (params: {
    request: Request
    serverContext: object | undefined
    url: URL
  }) => string | undefined
}

export function useJwt(options: JwtPluginOptions): Plugin {
  if (!options.signingKey && !options.jwksUri) {
    throw new TypeError('You need to provide either a signingKey or a jwksUri')
  }

  if (options.signingKey && options.jwksUri) {
    throw new TypeError(
      'You need to provide either a signingKey or a jwksUri, not both',
    )
  }

  const {
    jwksUri,
    headerName = 'authorization',
    headerType = 'Bearer',
    extendContextField = 'jwt',
  } = options

  const payloadByRequest = new WeakMap<Request, JwtPayload | string>()

  let jwksClient: JwksClient
  if (jwksUri) {
    jwksClient = new JwksClient({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri,
    })
  }

  const getToken = options.getToken ?? defaultGetToken(headerName, headerType)

  return {
    async onRequest({ request, serverContext, url }) {
      const token = getToken({ request, serverContext, url })
      if (token != null) {
        const signingKey =
          options.signingKey ?? (await fetchKey(jwksClient, token))

        const verified = await verify(token, signingKey, options)

        if (!verified) {
          throw unauthorizedError(`Unauthenticated`)
        }

        payloadByRequest.set(request, verified)
      }
    },
    onContextBuilding({ context, extendContext }) {
      if (context.request == null) {
        throw new Error(
          'Request is not available on context! Make sure you use this plugin with GraphQL Yoga.',
        )
      }
      const payload = payloadByRequest.get(context.request)
      if (payload != null) {
        extendContext({
          [extendContextField]: payload,
        })
      }
    },
  }
}

function unauthorizedError(message: string) {
  return createGraphQLError(message, {
    extensions: {
      http: {
        status: 401,
      },
    },
  })
}

function verify(
  token: string,
  signingKey: string,
  options: Parameters<typeof jsonwebtoken.verify>[2],
) {
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, signingKey, options, (err, result) => {
      if (err) {
        // Should we expose the error message? Perhaps only in development mode?
        reject(unauthorizedError('Failed to decode authentication token'))
      } else {
        resolve(result as JwtPayload)
      }
    })
  })
}

async function fetchKey(
  jwksClient: JwksClient,
  token: string,
): Promise<string> {
  const decodedToken = decode(token, { complete: true })
  if (decodedToken?.header?.kid == null) {
    throw unauthorizedError(`Failed to decode authentication token`)
  }

  const secret = await jwksClient.getSigningKey(decodedToken.header.kid)
  const signingKey = secret?.getPublicKey()
  if (!signingKey) {
    throw unauthorizedError(`Failed to decode authentication token`)
  }
  return signingKey
}

const defaultGetToken =
  (
    headerName: string,
    headerType: string,
  ): NonNullable<JwtPluginOptions['getToken']> =>
  ({ request }) => {
    const header = request.headers.get(headerName)
    if (!header) {
      return
    }
    const [type, token] = header.split(' ')
    if (type !== headerType) {
      throw unauthorizedError(`Unsupported token type provided: "${type}"`)
    }
    return token
  }
