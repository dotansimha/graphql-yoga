---
'@graphql-yoga/common': patch
'@graphql-yoga/redis-event-target': patch
'@graphql-yoga/subscription': patch
---

Use `import type { Foo } from '@pkg'` instead of `import { type Foo } from '@pkg'` as many tools don't yet support this syntax.
