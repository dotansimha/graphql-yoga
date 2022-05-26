import { Injectable } from '@nestjs/common'
import { User } from './users.interfaces'

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      id: '5',
      name: 'GraphQL',
    },
  ]

  findById(id: string) {
    return Promise.resolve(this.users.find((p) => p.id === id))
  }
}
