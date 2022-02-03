declare module 'graphiql/graphiql.css' {
  export default string
}

declare module 'graphiql-explorer' {
  import React from 'react'
  import { GraphQLSchema } from 'graphql'

  declare function GraphiQLExplorer(props: {
    schema: GraphQLSchema
    query: string
    onEdit: (value: string) => void
    explorerIsOpen: boolean
    onToggleExplorer: () => void
  }): React.ReactElement
  export default GraphiQLExplorer
}
