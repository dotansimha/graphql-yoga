import { JwksClient } from 'jwks-rsa'
import { decode, verify, JwtPayload, Algorithm } from 'jsonwebtoken'
import { Plugin } from 'graphql-yoga'
import { GraphQLError } from 'graphql'

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
   * Default: ["RS256"] (Allowed values: HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES384, ES512, PS256, PS384, PS512, none)
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
}

export function useJwt(options: JwtPluginOptions): Plugin {
  let jwksClient: JwksClient
  if (options.jwksUri) {
    jwksClient = new JwksClient({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: options.jwksUri,
    })
  }
  const headerName = options.headerName || 'authorization'
  const headerType = options.headerType || 'Bearer '
  const contextFieldName = options.extendContextField || '_jwt'
  const payloadByRequest = new WeakMap<Request, JwtPayload | string>()
  return {
    async onRequest({ request }) {
      const header = request.headers.get(headerName)
      if (header != null) {
        const [type, token] = header.split(' ')
        if (type !== headerType) {
          throw new GraphQLError(
            `Unsupported token type provided: "${type}"!`,
            {
              extensions: {
                http: {
                  status: 401,
                },
              },
            },
          )
        }
        const decodedToken = decode(token, { complete: true })
        if (decodedToken?.header?.kid == null) {
          throw new GraphQLError(`Failed to decode authentication token!`, {
            extensions: {
              http: {
                status: 401,
              },
            },
          })
        }
        let signingKey: string | undefined
        if (options.signingKey) {
          signingKey = options.signingKey
        } else if (options.jwksUri) {
          const secret = await jwksClient.getSigningKey(decodedToken.header.kid)
          signingKey = secret.getPublicKey()
        }
        if (signingKey) {
          const verified = await new Promise((resolve, reject) => {
             
            verify(
              token,
              signingKey!,
              {
                algorithms: options.algorithms || ['RS256'],
                audience: options.audience,
                issuer: options.issuer,
              },
              (err, result) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(result as JwtPayload)
                }
              },
            )
          })
          if (!verified) {
            throw new GraphQLError(`Unauthenticated!`, {
              extensions: {
                http: {
                  status: 401,
                },
              },
            })
          }
          payloadByRequest.set(request, verified)
        } else {
          payloadByRequest.set(request, decodedToken.payload)
        }
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
          [contextFieldName]: payload,
        })
      }
    },
  }
}
