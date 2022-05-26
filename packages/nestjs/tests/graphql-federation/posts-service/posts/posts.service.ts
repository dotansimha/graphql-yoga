import { Injectable } from '@nestjs/common'
import { Post } from './posts.interfaces'
import { PostType } from './post-type.enum'

@Injectable()
export class PostsService {
  private readonly posts: Post[] = [
    {
      id: '1',
      title: 'HELLO WORLD',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      userId: '5',
      publishDate: new Date(0),
      type: PostType.TEXT,
    },
  ]

  findAll() {
    return Promise.resolve(this.posts)
  }

  findById(id: string) {
    return Promise.resolve(this.posts.find((p) => p.id === id))
  }

  findByUserId(id: string) {
    return Promise.resolve(this.posts.filter((p) => p.userId === id))
  }

  findByType(type: PostType) {
    return Promise.resolve(this.posts.filter((p) => p.type === type))
  }

  async publish(id: string, publishDate: Date) {
    const post = await this.findById(id)
    post.publishDate = publishDate
    return post
  }
}
