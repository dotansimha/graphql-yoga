import { Plugin } from '../types.js'

const singleMediaTypes = [
  'application/graphql-response+json' as const,
  'application/json' as const,
]
export type SingleResultMediaType = typeof singleMediaTypes[0]

const streamingMediaTypes = [
  'multipart/mixed' as const,
  'text/event-stream' as const,
]
export type StreamingResultMediaType = typeof streamingMediaTypes[0]

export const acceptableMediaTypes = [
  ...singleMediaTypes,
  ...streamingMediaTypes,
]
export type AcceptableMediaType = typeof acceptableMediaTypes[0]

const acceptForRequest = new WeakMap<Request, AcceptableMediaType[]>()
export function getAcceptForRequest(request: Request): AcceptableMediaType[] {
  return acceptForRequest.get(request) || []
}

export function useAccept(): Plugin {
  return {
    async onRequest({ request, endResponse, fetchAPI }) {
      const accepted: AcceptableMediaType[] = []
      acceptForRequest.set(request, accepted)

      const accepts = (request.headers.get('accept') || '*/*')
        .replace(/\s/g, '')
        .toLowerCase()
        .split(',')

      for (const accept of accepts) {
        const [mediaType, ...params] = accept.split(';')
        const charset =
          params?.find((param) => param.includes('charset=')) || 'charset=utf-8' // utf-8 is assumed when not specified;

        if (charset !== 'charset=utf-8') {
          // only utf-8 is supported
          continue
        }

        if (
          mediaType === 'application/graphql-response+json' ||
          mediaType === 'application/*' ||
          mediaType === '*/*'
        ) {
          accepted.push('application/graphql-response+json')
        }

        if (mediaType === 'application/json') {
          accepted.push('application/json')
        }

        if (mediaType === 'text/*' || mediaType === 'text/event-stream') {
          accepted.push('text/event-stream')
        }

        if (mediaType === 'multipart/*' || mediaType === 'multipart/mixed') {
          accepted.push('multipart/mixed')
        }
      }

      if (!accepted.length) {
        endResponse(
          new fetchAPI.Response(null, {
            status: 406,
            statusText: 'Not Acceptable',
            headers: {
              accept: acceptableMediaTypes.join('; charset=utf-8, '),
            },
          }),
        )
      }
    },
  }
}
