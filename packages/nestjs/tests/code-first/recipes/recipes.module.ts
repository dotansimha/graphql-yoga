import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { UnauthorizedFilter } from '../common/filters/unauthorized.filter'
import { DateScalar } from '../common/scalars/date.scalar'
import { IRecipesResolver } from './irecipes.resolver'
import { RecipesResolver } from './recipes.resolver'
import { RecipesService } from './recipes.service'

@Module({
  providers: [
    RecipesResolver,
    IRecipesResolver,
    RecipesService,
    DateScalar,
    {
      provide: APP_FILTER,
      useClass: UnauthorizedFilter,
    },
  ],
})
export class RecipesModule {}
