import { LogFunction } from 'apollo-server-core'
import { CorsOptions } from 'cors'
import { Request, Response } from 'express'
import {
  GraphQLFieldResolver,
  GraphQLIsTypeOfFn,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLTypeResolver,
  ValidationContext,
} from 'graphql'
import { IMiddleware as IFieldMiddleware } from 'graphql-middleware'
import { IMocks } from 'graphql-tools'
import {
  IDirectiveResolvers,
  IResolverValidationOptions,
  ITypeDefinitions,
} from 'graphql-tools/dist/Interfaces'
import { SchemaDirectiveVisitor } from 'graphql-tools/dist/schemaVisitor'
import { ExecutionParams } from 'subscriptions-transport-ws'

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>
export interface IResolvers<Context> {
  [key: string]: (() => any) | IResolverObject<Context> | GraphQLScalarType
}

export type IResolverObject<Context> = {
  [key: string]:
    | GraphQLFieldResolver<any, Context, any>
    | IResolverOptions<any, Context, any>
}

export interface IResolverOptions<Source, Context, Args> {
  resolve?: GraphQLFieldResolver<Source, Context, Args>
  subscribe?: GraphQLFieldResolver<Source, Context, Args>
  __resolveType?: GraphQLTypeResolver<Source, Context>
  __isTypeOf?: GraphQLIsTypeOfFn<Source, Context>
}

export type Context = { [key: string]: any }

export interface ContextParameters {
  request: Request
  response: Response
  connection: ExecutionParams
}

export type ContextCallback = (params: ContextParameters) => Context

// check https://github.com/jaydenseric/apollo-upload-server#options for documentation
export interface UploadOptions {
  maxFieldSize?: number
  maxFileSize?: number
  maxFiles?: number
}

export interface TracingOptions {
  mode: 'enabled' | 'disabled' | 'http-header'
}

export type ValidationRules = Array<(context: ValidationContext) => any>

export type ValidationRulesExpressCallback = (
  request: Request,
  response: Response,
) => ValidationRules

export interface ApolloServerOptions {
  tracing?: boolean | TracingOptions
  cacheControl?: boolean
  formatError?: Function
  logFunction?: LogFunction
  rootValue?: any
  validationRules?: ValidationRules | ValidationRulesExpressCallback
  fieldResolver?: GraphQLFieldResolver<any, any, any>
  formatParams?: Function
  formatResponse?: Function
  debug?: boolean
}

export interface HttpsOptions {
  cert: string | Buffer
  key: string | Buffer
}

export interface Options extends ApolloServerOptions {
  port?: number | string
  cors?: CorsOptions | false
  uploads?: UploadOptions | false
  endpoint?: string
  subscriptions?: SubscriptionServerOptions | string | false
  playground?: string | false
  https?: HttpsOptions
  deduplicator?: boolean
  getEndpoint?: string | boolean
  bodyParserOptions?: BodyParserJSONOptions
}

export interface OptionsWithHttps extends Options {
  https: HttpsOptions
}

export type OptionsWithoutHttps = Omit<Options, 'https'>

export interface SubscriptionServerOptions {
  path?: string
  onConnect?: Function
  onDisconnect?: Function
  keepAlive?: number
}

export interface Props {
  directiveResolvers?: IDirectiveResolvers<any, any>
  schemaDirectives?: {
    [name: string]: typeof SchemaDirectiveVisitor
  }
  typeDefs?: ITypeDefinitions
  resolvers?: IResolvers
  resolverValidationOptions?: IResolverValidationOptions
  schema?: GraphQLSchema
  context?: Context | ContextCallback
  mocks?: IMocks
  middlewares?: IFieldMiddleware[]
}

export interface LambdaProps {
  directiveResolvers?: IDirectiveResolvers<any, any>
  schemaDirectives?: {
    [name: string]: typeof SchemaDirectiveVisitor
  }
  typeDefs?: string
  resolvers?: IResolvers
  schema?: GraphQLSchema
  context?: Context | ContextCallback
  options?: LambdaOptions
}

export interface LambdaOptions extends ApolloServerOptions {
  endpoint?: string
  deduplicator?: boolean
}

export interface BodyParserJSONOptions {
  limit?: number | string
  inflate?: boolean
  reviver?: any
  strict?: boolean
  type?: string
  verify?: any
}
