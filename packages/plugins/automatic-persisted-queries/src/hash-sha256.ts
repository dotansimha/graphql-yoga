const webCrypto: Crypto | undefined = globalThis.crypto

const sha256Browser = (bytes: Uint8Array): Promise<Uint8Array> => {
  const hash = webCrypto!.subtle.digest({ name: 'SHA-256' }, bytes)
  return new Promise((resolve, reject) => {
    Promise.resolve(hash)
      .then((result) => {
        resolve(new Uint8Array(result))
      })
      .catch((error) => {
        reject(error)
      })
  })
}

let nodeCrypto: Promise<typeof import('crypto')> | void
if (typeof window === 'undefined' && !webCrypto) {
  // Indirect eval'd require/import to guarantee no side-effects in module scope
  // (optimization for minifier)
  try {
    // eslint-disable-next-line no-new-func
    nodeCrypto = Promise.resolve(
      new Function('require', 'return require("crypto")')(require),
    )
  } catch (_error) {
    try {
      // eslint-disable-next-line no-new-func
      nodeCrypto = new Function('return import("crypto")')()
    } catch (_error) {}
  }
}

export const hashSHA256 = async (text: string): Promise<string> => {
  // Node.js support
  if (nodeCrypto) {
    return nodeCrypto.then((crypto) =>
      crypto.createHash('sha256').update(text).digest('hex'),
    )
  }

  if (webCrypto) {
    let buf: Uint8Array
    if (typeof TextEncoder !== 'undefined') {
      buf = new TextEncoder().encode(text)
    } else {
      buf = new Uint8Array(text.length)
      for (let i = 0, l = text.length; i < l; i++) {
        // NOTE: We assume that the input GraphQL Query only uses UTF-8 at most
        // since GraphQL mostly consists of ASCII, this is completely fine
        buf[i] = text.charCodeAt(i)
      }
    }

    const out = await sha256Browser(buf)

    let hash = ''
    for (let i = 0, l = out.length; i < l; i++) {
      const hex = out[i].toString(16)
      hash += '00'.slice(0, Math.max(0, 2 - hex.length)) + hex
    }

    return hash
  }

  if (globalThis?.process?.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      '[@graphql-yoga/automatic-persisted-queries]: The Node Crypto and Web Crypto APIs are not available.\n' +
        'This is an unexpected error. Please report it by filing a GitHub Issue.',
    )
  }

  return Promise.resolve('')
}
