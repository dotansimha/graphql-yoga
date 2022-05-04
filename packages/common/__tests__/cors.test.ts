import { Request } from 'cross-undici-fetch'
import { request } from 'http'
import { createServer } from '../src/server'

describe('CORS', () => {
  describe('Default behavior', () => {
    const yoga = createServer()
    it('should return the wildcard if no origin is sent with header', () => {
      const request = new Request('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const headers = yoga.getCORSResponseHeaders(request, {})
      expect(headers['Access-Control-Allow-Origin']).toBe('*')
    })
    it('should return the origin if it is sent with header', () => {
      const origin = 'http://localhost:4000'
      const request = new Request('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin,
        },
      })
      const headers = yoga.getCORSResponseHeaders(request, {})
      expect(headers['Access-Control-Allow-Origin']).toBe(origin)
    })
  })
  describe('Single origin', () => {
    const yoga = createServer({
      cors: {
        origin: 'http://localhost:4000',
      },
    })
    it('should return the origin even if it is different than the sent origin', () => {
      const request = new Request('http://localhost:4001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'http://localhost:4001',
        },
      })
      const headers = yoga.getCORSResponseHeaders(request, {})
      expect(headers['Access-Control-Allow-Origin']).toBe(
        'http://localhost:4000',
      )
    })
  })
  describe('Multiple origins', () => {
    const yoga = createServer({
      cors: {
        origin: ['http://localhost:4000', 'http://localhost:4001'],
      },
    })
    it('should return the origin itself if it matches', () => {
      const request = new Request('http://localhost:4001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'http://localhost:4001',
        },
      })
      const headers = yoga.getCORSResponseHeaders(request, {})
      expect(headers['Access-Control-Allow-Origin']).toBe(
        'http://localhost:4001',
      )
    })
    it('should return null even if it does not match', () => {
      const request = new Request('http://localhost:4002/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'http://localhost:4002',
        },
      })
      const headers = yoga.getCORSResponseHeaders(request, {})
      expect(headers['Access-Control-Allow-Origin']).toBe('null')
    })
  })
})
