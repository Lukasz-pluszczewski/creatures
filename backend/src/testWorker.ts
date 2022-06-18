import { expose } from 'threads/worker';

const workerState = {
  foo: 0,
};

expose({
  setFoo: (foo: number) => {
    workerState.foo = foo;
  },
  getFoo: () => {
    return workerState.foo;
  },
  add: (a: number, b: number) => a + b,
  addShared: async (argsBuffer, resultsBuffer) => {
    const args = new Uint8Array(argsBuffer);
    const results = new Uint8Array(resultsBuffer);

    results[0] = args[0] + args[1];
  },
  doubleShared: async (argsBuffer) => {
    const args = new Uint8Array(argsBuffer);
    args.forEach((value, index) => {
      args[index] = value * 2;
    });
  },
  complexObject: async (data: { args: SharedArrayBuffer, results: SharedArrayBuffer }) => {
    const args = new Uint8Array(data.args);
    const results = new Uint8Array(data.results);

    results[0] = args[0] + args[1];
  },
})
