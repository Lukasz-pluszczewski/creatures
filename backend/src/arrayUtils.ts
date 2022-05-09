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

export const sample = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export const getIndexFromCoordinates = (x: number, y: number, width: number) => y * width + x;
export const getCoordinatesFromIndex = (index: number, width: number) => {
  const x = index % width;
  const y = Math.floor(index / width);
  return [ x, y ];
}
