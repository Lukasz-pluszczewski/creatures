export const createArray = (length: number) => Array(length).fill(0);

export const push = <T>(arr: T[] = [], el: T) => [...arr, el];

export const times = (n: number, cb: (index: number) => void) => {
  for (let i = 0; i < n; i++) {
    cb(i);
  }
};
