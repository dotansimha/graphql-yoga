import { Field, ObjectType } from '@nestjs/graphql'
@ObjectType()
export class Category {
  @Field((type) => String)
  name: string

  @Field((type) => String, { defaultValue: 'default value' })
  description: string

  @Field((type) => [String], { defaultValue: [] })
  tags: string[]

  constructor(category: Partial<Category>) {
    Object.assign(this, category)
  }
}
