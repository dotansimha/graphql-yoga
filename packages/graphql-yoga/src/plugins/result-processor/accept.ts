export function getMediaTypesForRequestInOrder(request: Request): string[] {
  const accepts = (request.headers.get('accept') || '*/*')
    .replace(/\s/g, '')
    .toLowerCase()
    .split(',');
  const mediaTypes: string[] = [];
  for (const accept of accepts) {
    if (accept.includes('charset=') && !accept.includes('charset=utf-8')) {
      // only utf-8 is supported
      continue;
    }
    const acceptParts = accept.split(';');
    const mediaType = acceptParts[0];
    mediaTypes.push(mediaType);
  }
  return mediaTypes.reverse();
}

export function isMatchingMediaType(askedMediaType: string, processorMediaType: string) {
  const [askedPre, askedSuf] = askedMediaType.split('/');
  const [pre, suf] = processorMediaType.split('/');
  if ((pre === '*' || pre === askedPre) && (suf === '*' || suf === askedSuf)) {
    return true;
  }
  return false;
}
