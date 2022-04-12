import {
  getOperationAST,
  DocumentNode,
  OperationDefinitionNode,
  ExecutionArgs,
  ExecutionResult,
  GraphQLError,
} from 'graphql'
import { isAsyncIterable } from '@graphql-tools/utils'
import { ExecutionPatchResult, RequestProcessContext } from './types'
import { encodeString } from './encodeString'

interface ErrorResponseParams {
  status?: number
  headers: Record<string, string>
  errors: GraphQLError[]
  isEventStream: boolean
}

async function* getSingleResult(payload: any) {
  yield payload
}

function getExecutableOperation(
  document: DocumentNode,
  operationName?: string,
): OperationDefinitionNode {
  const operation = getOperationAST(document, operationName)

  if (!operation) {
    throw new Error('Could not determine what operation to execute.')
  }

  return operation
}

export async function processRequest<TContext, TRootValue = {}>({
  contextFactory,
  execute,
  operationName,
  parse,
  query,
  request,
  schema,
  subscribe,
  validate,
  variables,
  extraHeaders,
  Response,
  ReadableStream,
}: RequestProcessContext<TContext, TRootValue>): Promise<Response> {
  function getErrorResponse({
    status = 500,
    headers,
    errors,
    isEventStream,
  }: ErrorResponseParams): Response {
    const payload: ExecutionResult = {
      data: null,
      errors,
    }
    if (isEventStream) {
      return getPushResponse(getSingleResult(payload))
    }
    const decodedString = encodeString(JSON.stringify(payload))
    return new Response(decodedString, {
      status,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Length': decodedString.byteLength.toString(),
      },
    })
  }

  function getRegularResponse(executionResult: ExecutionResult): Response {
    const responseBody = JSON.stringify(executionResult)
    const decodedString = encodeString(responseBody)
    const headersInit: HeadersInit = {
      ...extraHeaders,
      'Content-Type': 'application/json',
      'Content-Length': decodedString.byteLength.toString(),
    }
    const responseInit: ResponseInit = {
      headers: headersInit,
      status: 200,
    }
    return new Response(decodedString, responseInit)
  }

  function getMultipartResponse(
    asyncExecutionResult: AsyncIterable<ExecutionPatchResult<any>>,
  ): Response {
    const headersInit: HeadersInit = {
      ...extraHeaders,
      Connection: 'keep-alive',
      'Content-Type': 'multipart/mixed; boundary="-"',
      'Transfer-Encoding': 'chunked',
    }
    const responseInit: ResponseInit = {
      headers: headersInit,
      status: 200,
    }

    let iterator: AsyncIterator<ExecutionResult<any>>

    const readableStream = new ReadableStream({
      start(controller) {
        iterator = asyncExecutionResult[Symbol.asyncIterator]()
        controller.enqueue(encodeString(`---`))
      },
      async pull(controller) {
        const { done, value } = await iterator.next()
        if (value != null) {
          controller.enqueue(encodeString('\r\n'))

          controller.enqueue(
            encodeString('Content-Type: application/json; charset=utf-8'),
          )
          controller.enqueue(encodeString('\r\n'))

          const chunk = JSON.stringify(value)
          const encodedChunk = encodeString(chunk)

          controller.enqueue(
            encodeString('Content-Length: ' + encodedChunk.byteLength),
          )
          controller.enqueue(encodeString('\r\n'))

          controller.enqueue(encodeString('\r\n'))
          controller.enqueue(encodedChunk)
          controller.enqueue(encodeString('\r\n'))

          controller.enqueue(encodeString('---'))
        }
        if (done) {
          controller.enqueue(encodeString('\r\n-----\r\n'))
          controller.close()
        }
      },
      async cancel(e) {
        await iterator.return?.(e)
      },
    })

    return new Response(readableStream, responseInit)
  }

  function getPushResponse(
    asyncExecutionResult: AsyncIterable<ExecutionResult<any>>,
  ): Response {
    const headersInit: HeadersInit = {
      ...extraHeaders,
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Encoding': 'none',
    }
    const responseInit: ResponseInit = {
      headers: headersInit,
      status: 200,
    }

    let iterator: AsyncIterator<ExecutionResult<any>>

    const readableStream = new ReadableStream({
      start() {
        iterator = asyncExecutionResult[Symbol.asyncIterator]()
      },
      async pull(controller) {
        const { done, value } = await iterator.next()
        if (value != null) {
          const chunk = JSON.stringify(value)
          controller.enqueue(encodeString(`data: ${chunk}\n\n`))
        }
        if (done) {
          controller.close()
        }
      },
      async cancel(e) {
        await iterator.return?.(e)
      },
    })
    return new Response(readableStream, responseInit)
  }

  let contextValue: TContext | undefined
  let document: DocumentNode
  let operation: OperationDefinitionNode | undefined

  const isEventStream = !!request.headers
    .get('accept')
    ?.includes('text/event-stream')

  try {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return getErrorResponse({
        status: 405,
        headers: {
          Allow: 'GET, POST',
          ...extraHeaders,
        },
        errors: [
          new GraphQLError('GraphQL only supports GET and POST requests.'),
        ],
        isEventStream,
      })
    }

    if (query == null) {
      return getErrorResponse({
        status: 400,
        errors: [new GraphQLError('Must provide query string.')],
        isEventStream,
        headers: extraHeaders,
      })
    }

    try {
      if (typeof query !== 'string' && query.kind === 'Document') {
        document = query
      } else {
        document = parse(query)
      }
    } catch (e: unknown) {
      return getErrorResponse({
        status: 400,
        errors: [e as GraphQLError],
        isEventStream,
        headers: extraHeaders,
      })
    }

    const validationErrors = validate(schema, document)
    if (validationErrors.length > 0) {
      return getErrorResponse({
        status: 400,
        errors: validationErrors,
        isEventStream,
        headers: extraHeaders,
      })
    }

    operation = getExecutableOperation(document, operationName)

    if (operation.operation === 'mutation' && request.method === 'GET') {
      return getErrorResponse({
        status: 405,
        errors: [
          new GraphQLError(
            'Can only perform a mutation operation from a POST request.',
          ),
        ],
        headers: {
          Allow: 'POST',
          ...extraHeaders,
        },
        isEventStream,
      })
    }

    let variableValues: { [name: string]: any } | undefined

    try {
      if (variables) {
        variableValues =
          typeof variables === 'string' ? JSON.parse(variables) : variables
      }
    } catch (_error) {
      return getErrorResponse({
        errors: [new GraphQLError('Variables are invalid JSON.')],
        status: 400,
        isEventStream,
        headers: extraHeaders,
      })
    }

    contextValue = await contextFactory()

    const executionArgs: ExecutionArgs = {
      schema,
      document,
      contextValue,
      variableValues,
      operationName,
    }

    if (operation.operation === 'subscription') {
      const result = await subscribe(executionArgs)

      // If errors are encountered while subscribing to the operation, an execution result
      // instead of an AsyncIterable.
      if (isAsyncIterable<ExecutionPatchResult>(result)) {
        return getPushResponse(result)
      } else {
        if (isEventStream) {
          return getPushResponse(result)
        } else {
          return getRegularResponse(result)
        }
      }
    } else {
      const result = await execute(executionArgs)

      // Operations that use @defer, @stream and @live will return an `AsyncIterable` instead of an
      // execution result.
      if (isAsyncIterable<ExecutionPatchResult>(result)) {
        return isEventStream
          ? getPushResponse(result)
          : getMultipartResponse(result)
      } else {
        return getRegularResponse(result)
      }
    }
  } catch (error: any) {
    const errors = [
      error instanceof GraphQLError
        ? error
        : new GraphQLError(
            error.message,
            undefined,
            undefined,
            undefined,
            undefined,
            error,
          ),
    ]

    return getErrorResponse({
      status: 500,
      errors,
      isEventStream,
      headers: extraHeaders,
    })
  }
}
