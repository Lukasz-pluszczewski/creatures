import { TypedArray } from './types';

export type ValueOf<T> = T[keyof T];

export type RecursiveToBuffers<T> = T extends (infer U)[]
  ? RecursiveToBuffers<U>[] : T extends { [key: string]: infer I}
  ? { [key: string]: RecursiveToBuffers<I> } : T extends TypedArray
  ? T['buffer'] : T;
