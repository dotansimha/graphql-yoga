import { GatewayConfig } from '@apollo/gateway'
import { Type } from '@nestjs/common'
import {
  GqlModuleAsyncOptions,
  GqlOptionsFactory,
  GraphQLDriver,
} from '@nestjs/graphql'

import { YogaDriverConfig } from './yoga-driver-config.interface'

export interface YogaGatewayDriverConfig<TDriver extends GraphQLDriver = any> {
  /**
   * GraphQL gateway adapter
   */
  driver?: Type<TDriver>
  /**
   * Gateway configuration
   */
  gateway?: GatewayConfig
  /**
   * Server configuration
   */
  server?: Omit<
    YogaDriverConfig,
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
  >
}

export type YogaGatewayDriverConfigFactory =
  GqlOptionsFactory<YogaGatewayDriverConfig>
export type YogaGatewayDriverAsyncConfig =
  GqlModuleAsyncOptions<YogaGatewayDriverConfig>
