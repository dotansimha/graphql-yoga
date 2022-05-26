import { ArgsType, Field, Int } from '@nestjs/graphql'
import { Max, Min } from 'class-validator'
@ArgsType()
export class RecipesArgs {
  @Field((type) => Int, { description: 'number of items to skip' })
  @Min(0)
  skip: number = 0

  @Field((type) => Int)
  @Min(1)
  @Max(50)
  take: number = 25
}
