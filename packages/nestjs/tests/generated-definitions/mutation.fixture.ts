/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export interface Cat {
  id: number
}

export interface IMutation {
  createCat(name?: Nullable<string>): Nullable<Cat> | Promise<Nullable<Cat>>
  returnsQuery(): Nullable<IQuery> | Promise<Nullable<IQuery>>
}

export interface IQuery {
  query(): Nullable<number> | Promise<Nullable<number>>
}

type Nullable<T> = T | null
