const textEncoder = new TextEncoder()
export function encodeString(str: string): Uint8Array {
  // TODO: enhance this
  if ('Buffer' in globalThis) {
    return Buffer.from(str, 'utf8')
  }
  return textEncoder.encode(str)
}
