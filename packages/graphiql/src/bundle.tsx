import React from 'react'
import ReactDOM from 'react-dom'
import { YogaGraphiQL } from './YogaGraphiQL'
import type { YogaGraphiQLOptions } from '@graphql-yoga/render-graphiql'

export function renderYogaGraphiQL(
  element: Element,
  opts?: YogaGraphiQLOptions,
) {
  ReactDOM.render(<YogaGraphiQL {...opts} />, element)
}
