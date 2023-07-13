import React from 'react';
import ReactDOM from 'react-dom';
import { YogaGraphiQL, YogaGraphiQLProps } from './YogaGraphiQL.js';

export function renderYogaGraphiQL(element: Element, opts?: YogaGraphiQLProps) {
  ReactDOM.render(<YogaGraphiQL {...opts} />, element);
}
