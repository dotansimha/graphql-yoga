import { PostType } from './post-type.enum'

export interface Post {
  id: string
  title: string
  body: string
  userId: string
  publishDate: Date
  type: PostType
}
