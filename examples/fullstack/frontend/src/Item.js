import React, { Component } from 'react'

class Item extends Component {
  render() {
    return (
      <div>
        <div>{this.props.name}</div>
      </div>
    )
  }
}

export default Item
