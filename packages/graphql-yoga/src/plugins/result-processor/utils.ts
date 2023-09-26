import { GraphQLError } from 'graphql';
import { ExecutionResult } from '@graphql-tools/utils';
import { createGraphQLError, isGraphQLError } from '../../error.js';
import type { MaybeArray } from '../../types.js';

// JSON stringifier that adjusts the result error extensions while serialising
export function getResultWithoutInternals(result: MaybeArray<ExecutionResult>) {
  return Array.isArray(result)
    ? result.map(omitInternalsFromResultErrors)
    : omitInternalsFromResultErrors(result);
}

function omitInternalsFromResultErrors(result: ExecutionResult): ExecutionResult {
  if (result.errors?.length || result.extensions?.http) {
    const newResult = { ...result } as ExecutionResult;
    newResult.errors &&= newResult.errors.map(omitInternalsFromError);
    if (newResult.extensions) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TS should check for unused vars instead
      const { http, ...extensions } = result.extensions;
      newResult.extensions = Object.keys(extensions).length ? extensions : undefined;
    }
    return newResult;
  }
  return result;
}

function omitInternalsFromError<E extends GraphQLError | Error | undefined>(err: E): E {
  if (isGraphQLError(err)) {
    const serializedError =
      'toJSON' in err && typeof err.toJSON === 'function' ? err.toJSON() : Object(err);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TS should check for unused vars instead
    const { http, unexpected, ...extensions } = serializedError.extensions || {};
    return createGraphQLError(err.message, {
      nodes: err.nodes,
      source: err.source,
      positions: err.positions,
      path: err.path,
      originalError: omitInternalsFromError(err.originalError || undefined),
      extensions: Object.keys(extensions).length ? extensions : undefined,
    }) as E;
  }
  return err;
}
