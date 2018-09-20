import { UserResolvers } from '../generated/resolvers'
import { TypeMap } from './types/TypeMap'
import { PostParent } from './Post'

export interface UserParent {
  id: string
  email: string
  name: string
  posts: PostParent[]
}

export const User: UserResolvers.Type<TypeMap> = {
  id: parent => parent.id,
  email: parent => parent.email,
  name: parent => parent.name,
  posts: (parent, args, ctx) => ctx.db.user({ id: parent.id }).posts(),
}
