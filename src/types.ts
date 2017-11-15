import { Request } from 'express'
import { GraphQLSchema, GraphQLFieldResolver, GraphQLScalarType, GraphQLIsTypeOfFn, GraphQLTypeResolver } from 'graphql'

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

export interface Props {
  typeDefs?: string
  resolvers?: IResolvers
  schema?: GraphQLSchema
  context?: Context | ContextCallback
}

export type Context = { [key: string]: any }
export type ContextCallback = (req: Request) => Context
