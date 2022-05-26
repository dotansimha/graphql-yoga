import { Module } from '@nestjs/common'
import { IRecipeResolver } from './irecipe.resolver'

@Module({
  providers: [IRecipeResolver],
})
export class RecipeModule {}
