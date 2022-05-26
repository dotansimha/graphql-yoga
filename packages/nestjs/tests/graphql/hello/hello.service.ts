import { Inject, Injectable, Scope } from '@nestjs/common'

@Injectable({ scope: Scope.REQUEST })
export class HelloService {
  constructor(@Inject('META') private readonly meta) {}

  getCats(): any[] {
    return [{ id: 1, name: 'Cat', age: 5 }]
  }
}
