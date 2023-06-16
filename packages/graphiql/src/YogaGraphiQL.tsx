import 'json-bigint-patch'
import React, { useMemo, useState } from 'react'
import { DocumentNode, Kind, parse } from 'graphql'
import { useExplorerPlugin } from '@graphiql/plugin-explorer'
import { Fetcher, FetcherOpts, FetcherParams } from '@graphiql/toolkit'
import {
  LoadFromUrlOptions,
  SubscriptionProtocol,
  UrlLoader,
} from '@graphql-tools/url-loader'
import {
  GraphiQL,
  GraphiQLInterface,
  GraphiQLProps,
  GraphiQLProvider,
} from 'graphiql'
import { useUrlSearchParams } from 'use-url-search-params'

import { YogaLogo } from './YogaLogo'
import 'graphiql/graphiql.css'
import '@graphiql/plugin-explorer/dist/style.css'
import './styles.css'

const getOperationWithFragments = (
  document: DocumentNode,
  operationName?: string,
): DocumentNode => {
  const definitions = document.definitions.filter((definition) => {
    if (
      definition.kind === Kind.OPERATION_DEFINITION &&
      operationName &&
      definition.name?.value !== operationName
    ) {
      return false
    }
    return true
  })

  return {
    kind: Kind.DOCUMENT,
    definitions,
  }
}

export type YogaGraphiQLProps = Omit<
  GraphiQLProps,
  | 'fetcher'
  | 'isHeadersEditorEnabled'
  | 'defaultEditorToolsVisibility'
  | 'onToggleDocs'
  | 'toolbar'
  | 'onSchemaChange'
  | 'query'
  | 'onEditQuery'
> &
  Partial<Omit<LoadFromUrlOptions, 'headers'>> & {
    title?: string
    /**
     * Logo to be displayed in the top right corner
     */
    logo?: React.ReactNode
    /**
     * Extra headers you always want to pass with users' headers input
     */
    additionalHeaders?: LoadFromUrlOptions['headers']
  }

export function YogaGraphiQL(props: YogaGraphiQLProps): React.ReactElement {
  const initialQuery = /* GraphQL */ `#
# Welcome to ${props.title || 'Yoga GraphiQL'}
#
# ${
    props.title || 'Yoga GraphiQL'
  } is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#     Merge Query:  Shift-Ctrl-M (or press the merge button above)
#
#       Run Query:  Ctrl-Enter (or press the play button above)
#
#   Auto Complete:  Ctrl-Space (or just start typing)
#
`

  const endpoint = new URL(
    props.endpoint ?? location.pathname,
    location.href,
  ).toString()

  const type = {
    query: String,
  }

  const urlLoader = useMemo(() => new UrlLoader(), [])

  const fetcher = useMemo(() => {
    const executor = urlLoader.getExecutorAsync(endpoint, {
      subscriptionsProtocol: SubscriptionProtocol.GRAPHQL_SSE,
      subscriptionsEndpoint: props.endpoint ?? location.pathname, // necessary because graphql-sse in graphql-tools url-loader defaults to endpoint+'/stream'
      credentials: 'same-origin',
      specifiedByUrl: true,
      directiveIsRepeatable: true,
      ...props,
      headers: props.additionalHeaders || {},
    })
    return function fetcher(graphQLParams: FetcherParams, opts?: FetcherOpts) {
      const document = getOperationWithFragments(
        parse(graphQLParams.query),
        graphQLParams.operationName ?? undefined,
      )
      return executor({
        document:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          document as any,
        operationName: graphQLParams.operationName ?? undefined,
        variables: graphQLParams.variables,
        extensions: {
          headers: opts?.headers,
        },
      })
    }
  }, [urlLoader, endpoint]) as Fetcher

  const [params, setParams] = useUrlSearchParams(
    {
      query: props.defaultQuery || initialQuery,
    },
    type,
    false,
  )

  const [query, setQuery] = useState(params.query?.toString())
  const explorerPlugin = useExplorerPlugin({
    query: query as string,
    onEdit: setQuery,
    showAttribution: true,
  })

  return (
    <div className="graphiql-container">
      <GraphiQLProvider
        plugins={[explorerPlugin]}
        query={query}
        headers={props.headers}
        schemaDescription={true}
        fetcher={fetcher}
      >
        <GraphiQLInterface
          isHeadersEditorEnabled
          defaultEditorToolsVisibility
          onEditQuery={(query) =>
            setParams({
              query,
            })
          }
        >
          <GraphiQL.Logo>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 40, display: 'flex' }}>
                {props?.logo || <YogaLogo />}
              </div>
              <span>
                {props?.title || (
                  <>
                    Yoga Graph
                    <em>i</em>
                    QL
                  </>
                )}
              </span>
            </div>
          </GraphiQL.Logo>
        </GraphiQLInterface>
      </GraphiQLProvider>
    </div>
  )
}
