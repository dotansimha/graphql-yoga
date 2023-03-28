---
'@graphql-yoga/nestjs': major
---

GraphQL Yoga driver for NestJS GraphQL.

### BREAKING CHANGES

- No more `subscriptionWithFilter` in YogaBaseDriver.
- `YogaBaseDriver.yogaInstance` has been renamed to `YogaBaseDriver.yoga`
- `YogaBaseDriver` has been renamed to `AbstractYogaDriver`
- Drop `@envelop/apollo-server-errors`, if you want to use it - supply it to the plugins yourself
- `graphql` is now a peer dependency
- `graphql-yoga` is now a peer dependency
- `installSubscriptionHandlers` driver option has been dropped, please use the `subscriptions`
  option
- Apollo Federation v2 support
- Apollo Federation driver has been moved to a separate package `@graphql-yoga/nestjs-federation`
- Dropped support for `@nestjs/graphql@v10`, now at least v11 is required (https://github.com/nestjs/graphql/pull/2435)
- Minimum Node.js engine is v14
