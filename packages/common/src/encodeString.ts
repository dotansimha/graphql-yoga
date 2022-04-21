function flatstr(s: string): string {
  // @ts-ignore
  s | 0
  return s
}

let encodeString: (str: string) => Uint8Array
if (globalThis.Buffer) {
  encodeString = function encodeStringWithBuffer(str: string) {
    return globalThis.Buffer.from(flatstr(str), 'utf8')
  }
} else {
  const textEncoder = new TextEncoder()
  encodeString = function encodeStringWithTextEncoder(str: string) {
    return textEncoder.encode(flatstr(str))
  }
}

export { encodeString }
