import { registerEnumType } from '@nestjs/graphql'

export enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
  Sideways = 'SIDEWAYS',
}

registerEnumType(Direction, {
  name: 'Direction', // this one is mandatory
  description: 'The basic directions', // this one is optional
  valuesMap: {
    Sideways: {
      deprecationReason: 'Replaced with Left or Right',
    },
    Up: {
      description: 'The primary direction',
    },
  },
})
