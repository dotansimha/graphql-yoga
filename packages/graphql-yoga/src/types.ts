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

/**
 * Overrides the standard library definition to include AsyncIterator support.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator
 */
export interface YogaReadableStreamOverride<R = any> extends ReadableStream<R> {
  [Symbol.asyncIterator]: () => AsyncIterator<R>;
}

export function castToYogaReadableStream<T extends ReadableStream<R>, R = any>(
  value: T,
): YogaReadableStreamOverride<R> {
  return value as unknown as YogaReadableStreamOverride;
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
