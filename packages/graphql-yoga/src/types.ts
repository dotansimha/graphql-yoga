/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GraphQLSchema } from 'graphql';
import type { PromiseOrValue } from '@envelop/core';
import type { createFetch } from '@whatwg-node/fetch';

export type GraphQLSchemaWithContext<TContext> = GraphQLSchema & {
  _context?: TContext;
};

export interface GraphQLParams<
  TVariables = Record<string, any>,
  TExtensions = Record<string, any>,
> {
  operationName?: string;
  query?: string;
  variables?: TVariables;
  extensions?: TExtensions;
}

export interface YogaInitialContext {
  /**
   * GraphQL Parameters
   */
  params: GraphQLParams;
  /**
   * An object describing the HTTP request.
   */
  request: Request;
}

export type CORSOptions =
  | {
      origin?: string[] | string;
      methods?: string[];
      allowedHeaders?: string[];
      exposedHeaders?: string[];
      credentials?: boolean;
      maxAge?: number;
    }
  | false;

declare global {
  interface ReadableStream<R = any> {
    [Symbol.asyncIterator]: () => AsyncIterator<R>;
  }
}

export type FetchAPI = ReturnType<typeof createFetch>;

export interface FetchEvent extends Event {
  request: Request;
  respondWith(response: PromiseOrValue<Response>): void;
}

export type YogaMaskedErrorOpts = {
  maskError: MaskError;
  errorMessage: string;
  isDev?: boolean;
};

export type MaskError = (error: unknown, message: string, isDev?: boolean) => Error;

export type MaybeArray<T> = T | T[];

export interface GraphQLHTTPExtensions {
  spec?: boolean;
  status?: number;
  headers?: Record<string, string>;
}
