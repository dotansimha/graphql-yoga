import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType({ description: 'orphaned type' })
export class SampleOrphanedType {
  @Field((type) => ID)
  id: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field()
  creationDate: Date

  @Field()
  get averageRating(): number {
    return 0.5
  }
}
