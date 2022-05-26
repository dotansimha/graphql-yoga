import { CustomScalar, Scalar } from '@nestjs/graphql'
import { Kind, ValueNode } from 'graphql'
@Scalar('Date')
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type'

  parseValue(value: any): Date {
    const date = new Date(parseInt(value, 10)) // value from the client
    if (isNaN(date.getTime())) {
      throw new TypeError('Invalid date given')
    }
    return date
  }

  serialize(value: Date): number {
    return value.getTime() // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)) // value from the client
    }
    return null
  }
}
