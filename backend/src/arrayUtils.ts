import { TypedArray } from './types';

export const createArray = (length: number) => Array(length).fill(0);

export const push = <T>(arr: T[] = [], el: T) => {
  if (arr) {
    arr.push(el);
    return arr;
  }
  return [el];
};

export const times = (n: number, cb: (index: number) => void) =>
  iterateOverRange(0, n, cb, false);
export const iterateOverRange = (start: number, end: number, cb: (index: number) => void, inclusive = true) => {
  for (let i = start; i < end + (inclusive ? 1 : 0); i++) {
    cb(i);
  }
};

export const timesAsync = async (n: number, cb: (index: number) => Promise<void>) =>
  iterateOverRangeAsync(0, n, cb, false);
export const iterateOverRangeAsync = async (
  start: number,
  end: number,
  cb: (index: number) => Promise<void>,
  inclusive = true
) => {
  for (let i = start; i < end + (inclusive ? 1 : 0); i++) {
    await cb(i);
  }
};

export const timesBatch = (n: number, batchSize: number, cb: (batch: number[]) => void) =>
  iterateOverRangeBatch(0, n, batchSize, cb, false);
export const iterateOverRangeBatch = (
  start: number,
  end: number,
  batchSize: number,
  cb: (batch: number[]) => void,
  inclusive = true
) => {
  let batch = [];
  for (let i = start; i < end + (inclusive ? 1 : 0); i++) {
    batch.push(i);
    if (batch.length === batchSize) {
      cb(batch);
      batch = [];
    }
  }
  if (batch.length) {
    cb(batch);
  }
};

export const timesAsyncBatch = async (n: number, batchSize: number, cb: (batch: number[]) => Promise<void>) =>
  iterateOverRangeAsyncBatch(0, n, batchSize, cb, false);
export const iterateOverRangeAsyncBatch = async (
  start: number,
  end: number,
  batchSize: number,
  cb: (batch: number[]) => Promise<void>,
  inclusive = true
) => {
  let batch = [];
  for (let i = start; i < end + (inclusive ? 1 : 0); i++) {
    batch.push(i);
    if (batch.length === batchSize) {
      await cb(batch);
      batch = [];
    }
  }
  if (batch.length) {
    await cb(batch);
  }
}

export const forEachAsync = async <T>(list: T[], cb: (item: T, index: number) => Promise<void>) => {
  for (let i = 0; i < list.length; i++) {
    await cb(list[i], i);
  }
};

export const mapAsync = async <T, R>(list: T[], cb: (item: T, index: number) => Promise<R>) => {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    result.push(await cb(list[i], i));
  }
  return result;
}

export const sample = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export const getIndexFromCoordinates = (x: number, y: number, width: number) => y * width + x;
export const getCoordinatesFromIndex = (index: number, width: number) => {
  const x = index % width;
  const y = Math.floor(index / width);
  return [ x, y ];
}

export const batch = <T>(array: T[], batchLength: number): T[][] => {
  const batches = [];
  let batch = [];
  for (let i = 0; i < array.length; i++) {
    batch.push(array[i]);
    if (batch.length === batchLength) {
      batches.push(batch);
      batch = [];
    }
  }
  if (batch.length) {
    batches.push(batch);
  }
  return batches;
};


export const untilTruthy = (list: any[] | TypedArray, cb: (index: number) => void, startingIndex = 0) => {
  console.log('untilTruthy', list, startingIndex);
  let creatureIndex = startingIndex;
  while (list[creatureIndex]) {
    cb(creatureIndex);
    creatureIndex++;
  }

  return creatureIndex - 1;
};

export const untilTruthyAsync = async (list: any[] | TypedArray, cb: (index: number) => Promise<void>, startingIndex = 0) => {
  let creatureIndex = startingIndex;
  while (list[creatureIndex]) {
    await cb(creatureIndex);
    creatureIndex++;
  }

  return creatureIndex - 1;
};
