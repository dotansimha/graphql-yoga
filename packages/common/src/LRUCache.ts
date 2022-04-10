export function getLRUCache<V>(max = 1000) {
  let storage: Record<string, V> = {}
  let keys: string[] = []
  return {
    get(key: string) {
      return storage[key]
    },
    set(key: string, value: V) {
      queueMicrotask(() => {
        if (storage[key] != null) {
          if (keys.indexOf(key)) {
            keys.splice(keys.indexOf(key), 1)
          }
        }
        keys.push(key)
        storage[key] = value
        while (keys.length > max) {
          const key = keys.shift()
          if (key != null) {
            delete storage[key]
          }
        }
      })
    },
    clear() {
      queueMicrotask(() => {
        storage = {}
        keys = []
      })
    },
  }
}
