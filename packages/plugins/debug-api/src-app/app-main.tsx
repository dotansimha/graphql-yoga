import React, { useEffect } from 'react'
import { useQuery } from 'urql'
import { graphql } from './gql'
import { GraphiQLProvider } from '@graphiql/react'
import { createGraphiQLFetcher } from '@graphiql/toolkit'

const executedOperationsQuery = graphql(`
  query executedOperations {
    executedOperations {
      id
      document
      variables
      startTime
      endTime
      result
      request {
        path
        headers {
          key
          value
        }
      }
      response {
        status
        headers {
          key
          value
        }
      }
    }
  }
`)

export function AppMain() {
  const [result, executeQuery] = useQuery({
    query: executedOperationsQuery,
  })

  useEffect(() => {
    if (!result.fetching) {
      const id = setTimeout(
        () => executeQuery({ requestPolicy: 'network-only', isPolling: true }),
        5000,
      )
      return () => clearTimeout(id)
    }
  }, [result.fetching, executeQuery])

  const { data, fetching, error } = result

  if (fetching) return <p>Loading...</p>
  if (error) return <p>Oh no... {error.message}</p>

  return (
    <div>
      {data!.executedOperations.map((operation) => (
        <div key={operation.id}>
          <h2>{operation.request.path}</h2>
        </div>
      ))}
    </div>
  )
}
