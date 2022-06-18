import { spawn, Worker, Pool } from 'threads';
import { getSharedTypedArray } from './typedArraysUtils';
import { createPool } from './threadPooolUtils';
import { Config } from './config';
import { Neuron, Simulator } from './types';
import { ModuleThread as ModuleThreadType } from 'threads/dist/types/master';

describe('threadPoolUtils', () => {
  describe('pool', () => {
    let pool;
    beforeAll(async () => {
      pool = await createPool(async () => {
        type WorkerType = {
          add: (a: number, b: number) => number,
          shared: (argsBuffer: SharedArrayBuffer, resultsBuffer: SharedArrayBuffer) => void,
          doubleShared: (argsBuffer: SharedArrayBuffer) => void,
        };
        return Pool(
          () => spawn<WorkerType>(new Worker('./testWorker')),
          8
        );
      });
    });
    afterAll(async () => {
      await pool.close();
    });

    it('runs task on all workers', async () => {
      pool.schedule('getFoo', 0, []);
      expect((await pool.getResults())[0]).not.toBe(33);

      await pool.runOnAllWorkers('setFoo', [33]);

      pool.schedule('getFoo', 0, []);
      pool.schedule('getFoo', 1, []);
      pool.schedule('getFoo', 2, []);
      pool.schedule('getFoo', 3, []);

      expect(await pool.getResults()).toEqual([33, 33, 33, 33]);
    });
    it('runs scheduled tasks in worker', async () => {
      pool.schedule('add', 1, [11, 58]);
      pool.schedule('add', 2, [12, 120]);

      const results = await pool.getResults();

      expect(results[1]).toEqual(69);
      expect(results[2]).toEqual(132);
    });
    it('runs scheduled tasks in worker with shared arrays', async () => {
      const args = getSharedTypedArray([17, 23], Uint8Array);
      const results = getSharedTypedArray([0], Uint8Array);

      pool.schedule('addShared', 0, [args.buffer, results.buffer]);

      await pool.getResults();
      expect(results[0]).toBe(40);

      pool.schedule('doubleShared', 0, [args.buffer]);
      pool.schedule('doubleShared', 1, [args.buffer]);

      await pool.getResults();
      expect(args[0]).toBe(68);
      expect(args[1]).toBe(92);
    });
  });
});
