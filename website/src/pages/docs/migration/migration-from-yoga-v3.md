import { PackageCmd } from '@theguild/components'

# Migration from Yoga V3

## Install the new NPM package

<PackageCmd packages={['graphql-yoga']} />

## Parse and validation cache are now under a single option `parserAndValidationCache`

Previously Yoga used two separate envelop plugins for parsing and caching. Now, it leverages a custom built plugin focused on Yoga. It therefore yields better performance, feels more native and of course reduces bundle size.

```diff
import {
  DocumentNode,
-  GraphQLError,
+  validate,
} from 'graphql'
import { createYoga } from 'graphql-yoga'
import { schema } from './my-schema'
import {
  documentCacheStore,
  errorCacheStore,
  validationCacheStore,
} from './my-cache'

interface CacheStore<T> {
  get(key: string): T | undefined
  set(key: string, value: T): void
}

const yoga = createYoga({
  schema,
- parserCache: {
+ parserAndValidationCache: {
    documentCache: documentCacheStore as CacheStore<DocumentNode>,
    errorCache: errorCacheStore as CacheStore<Error>,
+   validationCache: validationCacheStore as CacheStore<typeof validate>,
  },
- validationCache: validationCacheStore as CacheStore<readonly GraphQLError[]>
})
```
