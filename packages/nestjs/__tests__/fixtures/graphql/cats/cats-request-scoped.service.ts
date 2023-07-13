import { Injectable, Scope } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable({ scope: Scope.REQUEST })
export class CatsRequestScopedService {
  static COUNTER = 0;
  private readonly cats: Cat[] = [{ id: 1, name: 'Cat', age: 5 }];

  constructor() {
    CatsRequestScopedService.COUNTER++;
  }

  create(cat: Cat): Cat {
    this.cats.push(cat);
    return cat;
  }

  findAll(): Cat[] {
    return this.cats;
  }

  findOneById(id: number): Cat | undefined {
    return this.cats.find(cat => cat.id === id);
  }
}
