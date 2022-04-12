let encodeString: (str: string) => Uint8Array
if (globalThis.Buffer) {
  encodeString = function encodeStringWithBuffer(str: string) {
    return Buffer.from(str, 'utf8')
  }
} else {
  const textEncoder = new TextEncoder()
  encodeString = function encodeStringWithTextEncoder(str: string) {
    return textEncoder.encode(str)
  }
}

export { encodeString }
