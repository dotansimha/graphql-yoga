import React from 'react'
import ReactDOM from 'react-dom'
import { YogaGraphiQL } from './YogaGraphiQL'
import type { GraphiQLOptions } from '@graphql-yoga/common'

export function renderYogaGraphiQL(element: Element, opts?: GraphiQLOptions) {
  ReactDOM.render(<YogaGraphiQL {...opts} />, element)
}
