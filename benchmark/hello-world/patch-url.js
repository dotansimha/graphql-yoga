const fastUri = require('fast-uri')
const urlCache = new Map()
globalThis.URL = function URL(url, base) {
  let cached = urlCache.get(url)
  if (!cached) {
      cached = new PatchedURL(url, base)
        urlCache.set(url, cached)
  }
  return cached
}
class PatchedURL {
  constructor(url, base) {
    const cached = urlCache.get(url)
    if (cached) {
        return cached
    }
    if (!url.includes('://')) {
      url = base + url
    }
    this.urlStr = url
    urlCache.set(url, this)
  }
  get parsed() {
    if (!this._parsed) {
      this._parsed = fastUri.parse(this.urlStr)
    }
    return this._parsed
  }
  get hash() {
    return this.parsed.fragment || ''
  }
  set hash(value) {
    this.parsed.fragment = value
  }
  get host() {
    return this.parsed.host
  }
  set host(value) {
    this.parsed.host = value
  }
  get hostname() {
    return this.parsed.host
  }
  set hostname(value) {
    this.parsed.host = value
  }
  get href() {
    return fastUri.serialize(this.parsed)
  }
  set href(value) {
    this.urlStr = value
    this._parsed = null
  }
  toString() {
    return this.href
  }
  get origin() {
    return fastUri.serialize({
      scheme: this.parsed.scheme,
      host: this.parsed.host,
    })
  }
  set origin(value) {
    // no-op
  }
  get password() {
    return undefined
  }
  set password(value) {
    // no-op
  }
  get pathname() {
    return this.parsed.path
  }
  set pathname(value) {
    this.parsed.path = value
  }
  get port() {
    return this.parsed.port
  }
  set port(value) {
    this.parsed.port = value
  }
  get protocol() {
    return this.parsed.scheme
  }
  set protocol(value) {
    this.parsed.scheme = value
  }
  get search() {
    return this.parsed.query || ''
  }
  set search(value) {
    this.parsed.query = value
  }
  get searchParams() {
    if (!this._searchParams) {
      this._searchParams = new URLSearchParams(this.parsed.query)
    }
    return this._searchParams
  }
  get username() {
    return undefined
  }
  set username(value) {
    // no-op
  }
  toJSON() {
    return this.href
  }
}
