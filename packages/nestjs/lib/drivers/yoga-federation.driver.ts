import { Injectable } from '@nestjs/common'
import { loadPackage } from '@nestjs/common/utils/load-package.util'
import { printSchema } from 'graphql'
import { buildSubgraphSchema as buildSubgraphSchemaFn } from '@apollo/subgraph'

import { YogaFederationDriverConfig } from '../interfaces'
import { YogaBaseDriver } from './yoga-base.driver'
import { GraphQLFederationFactory } from '@nestjs/graphql'

@Injectable()
export class YogaFederationDriver extends YogaBaseDriver<YogaFederationDriverConfig> {
  constructor(
    private readonly graphqlFederationFactory: GraphQLFederationFactory,
  ) {
    super()
  }

  public async start(options: YogaFederationDriverConfig) {
    const opts = await this.graphqlFederationFactory.mergeWithSchema(
      options,
      ({ typeDefs, resolvers }) => {
        const { buildSubgraphSchema } = loadPackage(
          '@apollo/subgraph',
          'YogaFederationDriver',
          () => require('@apollo/subgraph'),
        ) as { buildSubgraphSchema: typeof buildSubgraphSchemaFn }

        return buildSubgraphSchema([{ typeDefs, resolvers }])
      },
    )

    if (opts.definitions && opts.definitions.path && opts.schema) {
      await this.graphQlFactory.generateDefinitions(
        printSchema(opts.schema),
        opts,
      )
    }

    const { typeDefs, resolvers, ...optsRest } = opts

    await super.start(opts)

    if (options.installSubscriptionHandlers || options.subscriptions) {
      // TL;DR <https://github.com/apollographql/apollo-server/issues/2776>
      throw new Error(
        'No support for subscriptions yet when using Apollo Federation',
      )
    }
  }
}
