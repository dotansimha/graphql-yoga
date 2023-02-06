import { lru } from 'tiny-lru'

export function createLRUCache() {
  return lru(1024)
}
