/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export enum Animal {
  DOG = 'DOG',
  CAT = 'CAT',
}

export enum Category {
  POST = 'POST',
}

export class Post {
  id: string
  title: string
  author: User
  category: Category
}

export class User {
  id: string
  posts?: Nullable<Nullable<Post>[]>
}

export abstract class IQuery {
  abstract getPosts():
    | Nullable<Nullable<Post>[]>
    | Promise<Nullable<Nullable<Post>[]>>
}

type Nullable<T> = T | null
