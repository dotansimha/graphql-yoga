let encodeString: (str: string) => Uint8Array
if ('Buffer' in globalThis) {
  encodeString = (str) => Buffer.from(str, 'utf-8')
} else {
  const textEncoder = new TextEncoder()
  encodeString = (str) => textEncoder.encode(str)
}

export { encodeString }
