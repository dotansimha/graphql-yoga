let encodeString: (str: string) => Uint8Array
// In Node, Buffer is faster than TextEncoder.
if (globalThis.Buffer) {
  encodeString = function encodeStringWithBuffer(str: string) {
    return globalThis.Buffer.from(str, 'utf8')
  }
} else {
  const textEncoder = new TextEncoder()
  encodeString = function encodeStringWithTextEncoder(str: string) {
    return textEncoder.encode(str)
  }
}

export { encodeString }
