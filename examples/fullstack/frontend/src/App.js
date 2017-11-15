import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
import Item from './Item'

const items = [
  {name: 'asd'},
  {name: 'fgh'},
  {name: 'mhv'},
  {name: 'uiy'},
]

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to <code>graphql-yoga</code></h1>
        </header>
        <div className="App-intro">
          <ul>
            {items.map(item => {
              return <li><Item name={item.name} /></li>
            })}
          </ul>
        </div>
      </div>
    )
  }
}

export default App
