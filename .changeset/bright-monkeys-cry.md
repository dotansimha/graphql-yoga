---
'@graphql-yoga/node': patch
---

Bring back Node 12 support

Even if Node 12 reached the end of its life, we keep supporting it until the next major release.

So in the previous release, we broke this support because of the new import names of Node's native packages such as `node:http` instead of `http`.
