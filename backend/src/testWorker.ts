import { expose } from "threads/worker"

expose({
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
  }
})
