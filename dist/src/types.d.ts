/// <reference types="express" />
/// <reference types="cors" />
import { Request } from 'express';
import { CorsOptions } from 'cors';
import { GraphQLSchema, GraphQLFieldResolver, GraphQLScalarType, GraphQLIsTypeOfFn, GraphQLTypeResolver } from 'graphql';
import { SubscriptionOptions } from 'graphql-subscriptions/dist/subscriptions-manager';
import { LogFunction } from 'apollo-server-core';
export interface IResolvers {
    [key: string]: (() => any) | IResolverObject | GraphQLScalarType;
}
export declare type IResolverObject = {
    [key: string]: GraphQLFieldResolver<any, any> | IResolverOptions;
};
export interface IResolverOptions {
    resolve?: GraphQLFieldResolver<any, any>;
    subscribe?: GraphQLFieldResolver<any, any>;
    __resolveType?: GraphQLTypeResolver<any, any>;
    __isTypeOf?: GraphQLIsTypeOfFn<any, any>;
}
export declare type Context = {
    [key: string]: any;
};
export interface ContextParameters {
    request: Request;
    connection: SubscriptionOptions;
}
export declare type ContextCallback = (params: ContextParameters) => Context;
export interface UploadOptions {
    maxFieldSize?: number;
    maxFileSize?: number;
    maxFiles?: number;
}
export interface TracingOptions {
    mode: 'enabled' | 'disabled' | 'http-header';
}
export interface Options {
    cors?: CorsOptions | false;
    disableSubscriptions?: boolean;
    tracing?: boolean | TracingOptions;
    port?: number;
    endpoint?: string;
    subscriptionsEndpoint?: string;
    playgroundEndpoint?: string;
    disablePlayground?: boolean;
    uploads?: UploadOptions;
}
export interface Props {
    typeDefs?: string;
    resolvers?: IResolvers;
    schema?: GraphQLSchema;
    context?: Context | ContextCallback;
    options?: Options;
    formatError?: Function;
    formatParams?: Function;
    formatResponse?: Function;
    logFunction?: LogFunction;
}
