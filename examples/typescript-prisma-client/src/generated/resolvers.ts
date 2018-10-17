import { GraphQLResolveInfo } from 'graphql'

export interface ITypeMap {
  Context: any

  QueryParent: any
  MutationParent: any
  PostParent: any
  UserParent: any
}

export namespace QueryResolvers {
  export type FeedType<T extends ITypeMap> = (
    parent: T['QueryParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => T['PostParent'][] | Promise<T['PostParent'][]>

  export type DraftsType<T extends ITypeMap> = (
    parent: T['QueryParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => T['PostParent'][] | Promise<T['PostParent'][]>

  export interface ArgsPost {
    id: string
  }

  export type PostType<T extends ITypeMap> = (
    parent: T['QueryParent'],
    args: ArgsPost,
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => T['PostParent'] | null | Promise<T['PostParent'] | null>

  export interface Type<T extends ITypeMap> {
    feed: (
      parent: T['QueryParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => T['PostParent'][] | Promise<T['PostParent'][]>
    drafts: (
      parent: T['QueryParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => T['PostParent'][] | Promise<T['PostParent'][]>
    post: (
      parent: T['QueryParent'],
      args: ArgsPost,
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => T['PostParent'] | null | Promise<T['PostParent'] | null>
  }
}

export namespace MutationResolvers {
  export interface ArgsCreateDraft {
    title: string
    content: string
    authorEmail: string
  }

  export type CreateDraftType<T extends ITypeMap> = (
    parent: T['MutationParent'],
    args: ArgsCreateDraft,
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => T['PostParent'] | Promise<T['PostParent']>

  export interface ArgsDeletePost {
    id: string
  }

  export type DeletePostType<T extends ITypeMap> = (
    parent: T['MutationParent'],
    args: ArgsDeletePost,
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => T['PostParent'] | null | Promise<T['PostParent'] | null>

  export interface ArgsPublish {
    id: string
  }

  export type PublishType<T extends ITypeMap> = (
    parent: T['MutationParent'],
    args: ArgsPublish,
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => T['PostParent'] | null | Promise<T['PostParent'] | null>

  export interface Type<T extends ITypeMap> {
    createDraft: (
      parent: T['MutationParent'],
      args: ArgsCreateDraft,
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => T['PostParent'] | Promise<T['PostParent']>
    deletePost: (
      parent: T['MutationParent'],
      args: ArgsDeletePost,
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => T['PostParent'] | null | Promise<T['PostParent'] | null>
    publish: (
      parent: T['MutationParent'],
      args: ArgsPublish,
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => T['PostParent'] | null | Promise<T['PostParent'] | null>
  }
}

export namespace PostResolvers {
  export type IdType<T extends ITypeMap> = (
    parent: T['PostParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => string | Promise<string>

  export type CreatedAtType<T extends ITypeMap> = (
    parent: T['PostParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => string | Promise<string>

  export type UpdatedAtType<T extends ITypeMap> = (
    parent: T['PostParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => string | Promise<string>

  export type IsPublishedType<T extends ITypeMap> = (
    parent: T['PostParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => boolean | Promise<boolean>

  export type TitleType<T extends ITypeMap> = (
    parent: T['PostParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => string | Promise<string>

  export type ContentType<T extends ITypeMap> = (
    parent: T['PostParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => string | Promise<string>

  export type AuthorType<T extends ITypeMap> = (
    parent: T['PostParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => T['UserParent'] | Promise<T['UserParent']>

  export interface Type<T extends ITypeMap> {
    id: (
      parent: T['PostParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => string | Promise<string>
    createdAt: (
      parent: T['PostParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => string | Promise<string>
    updatedAt: (
      parent: T['PostParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => string | Promise<string>
    isPublished: (
      parent: T['PostParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => boolean | Promise<boolean>
    title: (
      parent: T['PostParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => string | Promise<string>
    content: (
      parent: T['PostParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => string | Promise<string>
    author: (
      parent: T['PostParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => T['UserParent'] | Promise<T['UserParent']>
  }
}

export namespace UserResolvers {
  export type IdType<T extends ITypeMap> = (
    parent: T['UserParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => string | Promise<string>

  export type EmailType<T extends ITypeMap> = (
    parent: T['UserParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => string | Promise<string>

  export type NameType<T extends ITypeMap> = (
    parent: T['UserParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => string | Promise<string>

  export type PostsType<T extends ITypeMap> = (
    parent: T['UserParent'],
    args: {},
    ctx: T['Context'],
    info: GraphQLResolveInfo,
  ) => T['PostParent'][] | Promise<T['PostParent'][]>

  export interface Type<T extends ITypeMap> {
    id: (
      parent: T['UserParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => string | Promise<string>
    email: (
      parent: T['UserParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => string | Promise<string>
    name: (
      parent: T['UserParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => string | Promise<string>
    posts: (
      parent: T['UserParent'],
      args: {},
      ctx: T['Context'],
      info: GraphQLResolveInfo,
    ) => T['PostParent'][] | Promise<T['PostParent'][]>
  }
}

export interface IResolvers<T extends ITypeMap> {
  Query: QueryResolvers.Type<T>
  Mutation: MutationResolvers.Type<T>
  Post: PostResolvers.Type<T>
  User: UserResolvers.Type<T>
}
