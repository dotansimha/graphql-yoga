import { PropsWithChildren } from 'react'
import { Provider } from 'urql'
import { client } from './urql-client'

export function AppRoot(props: PropsWithChildren) {
  return <Provider value={client}>{props.children}</Provider>
}
