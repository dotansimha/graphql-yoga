import type { ApolloGateway, GatewayConfig } from '@apollo/gateway';
import { useApolloFederation as useApolloFederationPlugin } from '@envelop/apollo-federation';
import { Injectable, Type } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { GraphQLFederationFactory } from '@nestjs/graphql';
import { AbstractYogaDriver, YogaDriver, YogaDriverConfig, YogaDriverPlatform } from './index';

export type YogaFederationDriverConfig<Platform extends YogaDriverPlatform = 'express'> =
  YogaDriverConfig<Platform>;

@Injectable()
export class YogaFederationDriver<
  Platform extends YogaDriverPlatform = 'express',
> extends AbstractYogaDriver<Platform> {
  constructor(private readonly graphqlFederationFactory: GraphQLFederationFactory) {
    super();
  }

  public async start(options: YogaFederationDriverConfig<Platform>) {
    const opts = await this.graphqlFederationFactory.mergeWithSchema(options);

    if (options.definitions?.path) {
      const { printSubgraphSchema } = loadPackage('@apollo/subgraph', 'ApolloFederation', () =>
        require('@apollo/subgraph'),
      );
      await this.graphQlFactory.generateDefinitions(printSubgraphSchema(opts.schema), options);
    }

    await super.start(opts);

    if (options.subscriptions) {
      // See more: https://github.com/apollographql/apollo-server/issues/2776
      throw new Error('No support for subscriptions when using Apollo Federation');
    }
  }
}

export interface YogaGatewayDriverConfig<Platform extends YogaDriverPlatform = 'express'> {
  driver?: Type<YogaDriver<Platform>>;
  gateway?: GatewayConfig;
  server?: Omit<
    YogaDriverConfig<Platform>,
    | 'endpoint'
    | 'schema'
    | 'typeDefs'
    | 'definitions'
    | 'resolvers'
    | 'resolverValidationOptions'
    | 'directiveResolvers'
    | 'autoSchemaFile'
    | 'transformSchema'
    | 'subscriptions'
    | 'buildSchemaOptions'
    | 'fieldResolverEnhancers'
    | 'driver'
  >;
}

@Injectable()
export class YogaGatewayDriver<
  Platform extends YogaDriverPlatform = 'express',
> extends AbstractYogaDriver<Platform> {
  public async start(options: YogaGatewayDriverConfig<Platform>) {
    const { ApolloGateway } = loadPackage('@apollo/gateway', 'YogaGatewayDriver', () =>
      require('@apollo/gateway'),
    );
    const { useApolloFederation } = loadPackage(
      '@envelop/apollo-federation',
      'YogaGatewayDriver',
      () => require('@envelop/apollo-federation'),
    ) as { useApolloFederation: typeof useApolloFederationPlugin };

    const { server: serverOpts = {}, gateway: gatewayOpts = {} } = options;
    const gateway: ApolloGateway = new ApolloGateway(gatewayOpts);

    await gateway.load();

    await super.start({
      ...serverOpts,
      plugins: [
        ...(serverOpts.plugins || []),
        useApolloFederation({
          gateway,
        }),
      ],
    });
  }

  public async mergeDefaultOptions(
    options: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return {
      ...options,
      server: await super.mergeDefaultOptions(options?.server ?? {}),
    };
  }
}
