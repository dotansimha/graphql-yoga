import { GraphQLSchema } from 'graphql';
import { ApolloGateway, GatewayConfig } from '@apollo/gateway';
import { printSubgraphSchema } from '@apollo/subgraph';
import { useApolloFederation } from '@envelop/apollo-federation';
import {
  AbstractYogaDriver,
  YogaDriver,
  YogaDriverConfig,
  YogaDriverPlatform,
} from '@graphql-yoga/nestjs';
import { useApolloInlineTrace } from '@graphql-yoga/plugin-apollo-inline-trace';
import { Injectable, Type } from '@nestjs/common';
import { GraphQLFederationFactory } from '@nestjs/graphql';

export type YogaFederationDriverConfig<Platform extends YogaDriverPlatform = 'express'> =
  YogaDriverConfig<Platform>;

@Injectable()
export class YogaFederationDriver<
  Platform extends YogaDriverPlatform = 'express',
> extends AbstractYogaDriver<Platform> {
  constructor(private readonly graphqlFederationFactory: GraphQLFederationFactory) {
    super();
  }

  async generateSchema(options: YogaFederationDriverConfig<Platform>): Promise<GraphQLSchema> {
    return await this.graphqlFederationFactory.generateSchema(options);
  }

  public async start(options: YogaFederationDriverConfig<Platform>) {
    if (options.definitions?.path) {
      if (!options.schema) {
        throw new Error('Schema is required when providing definitions path');
      }
      await this.graphQlFactory.generateDefinitions(printSubgraphSchema(options.schema), options);
    }

    await super.start({
      ...options,
      plugins: [...(options?.plugins || []), useApolloInlineTrace()],
    });

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
  public async generateSchema(_options: YogaGatewayDriverConfig<Platform>): Promise<GraphQLSchema> {
    return new GraphQLSchema({});
  }

  public async start(options: YogaGatewayDriverConfig<Platform>) {
    const { server: serverOpts = {}, gateway: gatewayOpts = {} } = options;
    const gateway: ApolloGateway = new ApolloGateway(gatewayOpts);

    await gateway.load();

    await super.start({
      ...serverOpts,
      plugins: [...(serverOpts.plugins || []), useApolloFederation({ gateway })],
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
