import { Request } from 'express'
import { CorsOptions } from 'cors'
import { GraphQLSchema, GraphQLFieldResolver, GraphQLScalarType, GraphQLIsTypeOfFn, GraphQLTypeResolver } from 'graphql'
import { SubscriptionOptions } from 'graphql-subscriptions/dist/subscriptions-manager'

export interface IResolvers {
  [key: string]: (() => any) | IResolverObject | GraphQLScalarType
}

export type IResolverObject = {
  [key: string]: GraphQLFieldResolver<any, any> | IResolverOptions,
}

export interface IResolverOptions {
  resolve?: GraphQLFieldResolver<any, any>
  subscribe?: GraphQLFieldResolver<any, any>
  __resolveType?: GraphQLTypeResolver<any, any>
  __isTypeOf?: GraphQLIsTypeOfFn<any, any>
}

export type Context = { [key: string]: any }

export interface ContextParameters {
  request: Request
  connection: SubscriptionOptions
}

export type ContextCallback = (params: ContextParameters) => Context

export interface UploadOptions {
  maxFieldSize?: number
  maxFileSize?: number
  maxFiles?: number
}

export interface Options {
  cors?: CorsOptions | false
  disableSubscriptions?: boolean
  port?: number
  endpoint?: string
  subscriptionsEndpoint?: string
  playgroundEndpoint?: string
  disablePlayground?: boolean
  uploads?: UploadOptions
}

export interface Props {
  typeDefs?: string
  resolvers?: IResolvers
  schema?: GraphQLSchema
  context?: Context | ContextCallback
  options?: Options
}
