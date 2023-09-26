import { GraphQLErrorExtensions } from 'graphql';
import { PromiseOrValue } from '@envelop/core';
import { createGraphQLError } from '@graphql-tools/utils';
import { GraphQLParams } from '../../types.js';
import { isContentTypeMatch } from './utils.js';

export function isPOSTJsonRequest(request: Request) {
  return (
    request.method === 'POST' &&
    (isContentTypeMatch(request, 'application/json') ||
      isContentTypeMatch(request, 'application/graphql+json'))
  );
}

function handleJsonError(err: unknown): GraphQLParams {
  const extensions: GraphQLErrorExtensions = {
    http: {
      spec: true,
      status: 400,
    },
  };
  if (err instanceof Error) {
    extensions.originalError = {
      name: err.name,
      message: err.message,
    };
  }
  throw createGraphQLError('POST body sent invalid JSON.', {
    extensions,
  });
}

function handleJson(requestBody: GraphQLParams) {
  if (requestBody == null) {
    throw createGraphQLError(`POST body is expected to be object but received ${requestBody}`, {
      extensions: {
        http: {
          status: 400,
        },
      },
    });
  }

  const requestBodyTypeof = typeof requestBody;
  if (requestBodyTypeof !== 'object') {
    throw createGraphQLError(
      `POST body is expected to be object but received ${requestBodyTypeof}`,
      {
        extensions: {
          http: {
            status: 400,
          },
        },
      },
    );
  }

  return requestBody;
}

export function parsePOSTJsonRequest(request: Request): PromiseOrValue<GraphQLParams> {
  let requestBody$: PromiseOrValue<GraphQLParams>;

  try {
    requestBody$ = request.json();
  } catch (err) {
    return handleJsonError(err);
  }

  return requestBody$.then(handleJson).catch(handleJsonError);
}
