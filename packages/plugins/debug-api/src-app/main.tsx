import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppMain } from './app-main'
import { AppRoot } from './app-root'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppRoot>
      <AppMain />
    </AppRoot>
  </React.StrictMode>,
)
