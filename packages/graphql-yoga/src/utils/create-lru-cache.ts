import LRU from 'lru-cache'

const DEFAULT_MAX = 1024
const DEFAULT_TTL = 3_600_000

export function createLRUCache<T>() {
  return new LRU<string, T>({ max: DEFAULT_MAX, ttl: DEFAULT_TTL })
}
