import { Module } from '@nestjs/common'
import { CatsResolver } from './cats.resolver'

@Module({})
export class CatsModule {
  static register(
    resolverRegistrationMethod: 'useClass' | 'useFactory' | 'useValue',
  ) {
    switch (resolverRegistrationMethod) {
      case 'useClass':
        return {
          module: CatsModule,
          providers: [
            {
              provide: CatsResolver,
              useClass: CatsResolver,
            },
          ],
        }

      case 'useValue':
        return {
          module: CatsModule,
          providers: [
            {
              provide: CatsResolver,
              useValue: new CatsResolver(),
            },
          ],
        }

      case 'useFactory':
      default:
        return {
          module: CatsModule,
          providers: [
            {
              provide: CatsResolver,
              useFactory() {
                return new CatsResolver()
              },
            },
          ],
        }
    }
  }
}
