/* eslint-disable */
const fastUri = require('fast-uri');
globalThis.URL = class URL {
  constructor(url, base) {
    if (!url.includes('://')) {
      url = base + url
    }
    this.urlStr = url;
  }
  get parsed() {
    if (!this._parsed) {
      this._parsed = fastUri.parse(this.urlStr)
    }
  }
  get hash() {
    return this.parsed.fragment
  }
  get host() {
    return this.parsed.host
  }
  get hostname() {
    return this.parsed.host
  }
  get href() {
    return fastUri.serialize(this.parsed)
  }
  toString() {
    return this.href
  }
  get origin() {
    return this.parsed.protocol + '//' + this.parsed.host
  }
  get password() {
    throw new Error('Not implemented')
  }
  get pathname() {
    return this.parsed.path
  }
  get port() {
    return this.parsed.port
  }
  get protocol() {
    return this.parsed.scheme
  }
  get search() {
    return this.parsed.query
  }
  get searchParams() {
    if (!this._searchParams) {
      this._searchParams = new URLSearchParams(this.parsed.query)
    }
    return this._searchParams
  }
  get username() {
    throw new Error('Not implemented')
  } 
  toJSON() {
    return this.href
  }
}
const { createServer } = require('http')
const { createYoga, createSchema } = require('graphql-yoga')

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () =>
          'This is the `greetings` field of the root `Query` type',
      },
    },
  }),
  logging: false,
  multipart: false,
})

const server = createServer(yoga)

server.listen(4000, '127.0.0.1')
