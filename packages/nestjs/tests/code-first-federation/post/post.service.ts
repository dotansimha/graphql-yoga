import { Post } from './post.entity'
import { Injectable } from '@nestjs/common'

const data = [
  {
    id: 1,
    title: 'HELLO WORLD',
    authorId: 2,
  },
  {
    id: 2,
    title: 'lorem ipsum',
    authorId: 1,
  },
]

@Injectable()
export class PostService {
  public findOne(id: number) {
    const post = data.find((p) => p.id === id)
    if (post) {
      return new Post(post)
    }
    return null
  }

  public all() {
    return data.map((p) => new Post(p))
  }

  public forAuthor(authorId: number) {
    return data.filter((p) => p.authorId === authorId).map((p) => new Post(p))
  }
}
