# @graphql-yoga/node

## 0.0.1-beta.2

### Patch Changes

- daeea82: fix(common): bump cross-undici-fetch and pass encoding header for wider support
- Updated dependencies [8d03bee]
- Updated dependencies [11e80ea]
- Updated dependencies [daeea82]
  - @graphql-yoga/subscription@0.0.1-beta.1
  - @graphql-yoga/common@0.0.1-beta.2

## 0.0.1-beta.1

### Patch Changes

- Updated dependencies [a665e1e]
  - @graphql-yoga/common@0.0.1-beta.1

## 0.0.1-beta.0

### Patch Changes

- de1693e: trigger release
- Updated dependencies [de1693e]
  - @graphql-yoga/common@0.0.1-beta.0
  - @graphql-yoga/subscription@0.0.1-beta.0

## 0.1.0-alpha.4

### Minor Changes

- 133f8e9: feat(node): improve sendNodeResponse
- dcaea56: feat(node): add getServerUrl that returns expected full GraphQL API URL
- ce60a48: fix(node): add import of pino-pretty for the bundler-based envs like Next.JS
- dcaea56: add missing tslib dependency

### Patch Changes

- dcaea56: fix(node): use localhost instead of 0.0.0.0 on Windows
- f5f06f4: fix(node): do not try to print if document is falsy
- Updated dependencies [84091d2]
- Updated dependencies [dcaea56]
  - @graphql-yoga/common@0.2.0-alpha.11
  - @graphql-yoga/subscription@0.1.0-alpha.2

## 0.1.0-alpha.3

### Patch Changes

- Updated dependencies [890e4ec]
  - @graphql-yoga/common@0.2.0-alpha.10

## 0.1.0-alpha.2

### Patch Changes

- b0b244b: bump cross-undici-fetch
- Updated dependencies [b0b244b]
  - @graphql-yoga/common@0.2.0-alpha.9

## 0.1.0-alpha.1

### Patch Changes

- Updated dependencies [f2f6202]
  - @graphql-yoga/common@0.2.0-alpha.8

## 0.1.0-alpha.0

### Minor Changes

- d414f95: **BREAKING** Set `maskedErrors` value to `true` by default for safer defaults.

  **BREAKING** Remove `disableIntrospection`. [Please use `useDisableIntrospection` from `@envelop/disable-introspection` instead.](https://www.envelop.dev/plugins/use-disable-introspection)

### Patch Changes

- a10a16c: Node Server implementation has been moved to `@graphql-yoga/node` package.

  CLI implementation has been moved to
  `graphql-yoga` package.

- Updated dependencies [6750eff]
- Updated dependencies [d414f95]
- Updated dependencies [3e771f5]
- Updated dependencies [bea2dcc]
- Updated dependencies [fc1f2c7]
- Updated dependencies [f856b58]
- Updated dependencies [603ccd8]
- Updated dependencies [e93e62d]
- Updated dependencies [b1facf8]
- Updated dependencies [3e771f5]
- Updated dependencies [b37564e]
- Updated dependencies [5d840d9]
- Updated dependencies [f856b58]
- Updated dependencies [f856b58]
- Updated dependencies [a10a16c]
  - @graphql-yoga/common@0.2.0-alpha.7
  - @graphql-yoga/subscription@0.1.0-alpha.1
