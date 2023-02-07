import LRU from 'lru-cache'

export function createLRUCache<T>() {
  return new LRU<string, T>({ max: 1024 })
}
