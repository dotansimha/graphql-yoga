# @graphql-yoga/subscription

## 2.0.0

### Major Changes

- 3e771f5: re-export `Repeater` from `@repeaterjs/repeater`
- e99ec3e: initial subscription package implementation
- f856b58: export PubSub type
- 3e771f5: add pipe helper function
- f856b58: allow any AsyncIterable source for the map and filter operator
- dcaea56: add missing tslib dependency

### Patch Changes

- 8d03bee: fix publishing values when using the id argument for granular resource based subscriptions
- de1693e: trigger release
- f856b58: correctly terminate AsyncIterable returned from map/filter when the source stream ends

## 0.0.1-beta.1

### Patch Changes

- 8d03bee: fix publishing values when using the id argument for granular resource based subscriptions

## 0.0.1-beta.0

### Patch Changes

- de1693e: trigger release

## 0.1.0-alpha.2

### Minor Changes

- dcaea56: add missing tslib dependency

## 0.1.0-alpha.1

### Minor Changes

- 3e771f5: re-export `Repeater` from `@repeaterjs/repeater`
- f856b58: export PubSub type
- 3e771f5: add pipe helper function
- f856b58: allow any AsyncIterable source for the map and filter operator

### Patch Changes

- f856b58: correctly terminate AsyncIterable returned from map/filter when the source stream ends

## 0.1.0-alpha.0

### Minor Changes

- e99ec3e: initial subscription package implementation
