import { ITypeMap } from '../../generated/resolvers'

import { QueryParent } from '../Query'
import { MutationParent } from '../Mutation'
import { PostParent } from '../Post'
import { UserParent } from '../User'

import { Context } from './Context'

export interface TypeMap extends ITypeMap {
  Context: Context
  QueryParent: QueryParent
  MutationParent: MutationParent
  PostParent: PostParent
  UserParent: UserParent
}
