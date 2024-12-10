/* eslint-disable @typescript-eslint/no-empty-object-type */
import { LRUCache as LRU } from 'lru-cache';

const DEFAULT_MAX = 1024;
const DEFAULT_TTL = 3_600_000;

export type LRUCache<T extends {}> = LRU<string, T>;
export interface LRUCacheOptions {
  max?: number;
  ttl?: number;
}

export function createLRUCache<T extends {}>({
  max = DEFAULT_MAX,
  ttl = DEFAULT_TTL,
}: LRUCacheOptions = {}) {
  return new LRU<string, T>({ max, ttl });
}
