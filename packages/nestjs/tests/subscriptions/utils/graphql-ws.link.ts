import { ApolloLink, Operation, FetchResult } from 'apollo-link'
import { Observable } from 'apollo-client/util/Observable'
import { print } from 'graphql'
import { Client } from 'graphql-ws'

export class GraphQLWsLink extends ApolloLink {
  private client: Client

  constructor(client: Client) {
    super()
    this.client = client
  }

  public request(operation: Operation): Observable<FetchResult> {
    return new Observable((sink) => {
      return this.client.subscribe<FetchResult>(
        { ...operation, query: print(operation.query) },
        {
          next: sink.next.bind(sink),
          complete: sink.complete.bind(sink),
          error: sink.error.bind(sink),
        },
      )
    })
  }
}
