import { memoize1 } from '@graphql-tools/utils'

export const getMediaTypesForRequest = memoize1(
  function getMediaTypesForRequest(request: Request): string[] {
    const accepts = (request.headers.get('accept') || '*/*')
      .replace(/\s/g, '')
      .toLowerCase()
      .split(',')
    const mediaTypes: string[] = []
    for (const accept of accepts) {
      const [mediaType, ...params] = accept.split(';')
      const charset =
        params?.find((param) => param.includes('charset=')) || 'charset=utf-8' // utf-8 is assumed when not specified;

      if (charset !== 'charset=utf-8') {
        // only utf-8 is supported
        continue
      }
      mediaTypes.push(mediaType)
    }
    return mediaTypes
  },
)

export function isAcceptableByRequest(
  askedMediaType: string,
  request: Request,
): boolean {
  const mediaTypes = getMediaTypesForRequest(request)
  const [askedPre, askedSuf] = askedMediaType.split('/')
  return mediaTypes.some((mediaType) => {
    const [pre, suf] = mediaType.split('/')
    if (pre === '*' || pre === askedPre) {
      if (suf === '*' || suf === askedSuf) {
        return true
      }
    }
    return false
  })
}
