import { Pool, spawn, Worker } from 'threads';
import type { Pool as PoolType, ModuleThread as ModuleThreadType } from 'threads';
import { Config } from './config';
import { Neuron, Simulator } from './types';
import { Worker as WorkerType } from './workers/calculateSensorsData';

export const getCalculateSensorsWorkerPool = async () => {
  return Pool(
    () => spawn<WorkerType>(new Worker('./workers/calculateSensorsData')),
    8
  );
}

export const createPool = async <
  TWorker extends { [methodName: string]: (...args: any) => any }
>(
  getWorkerPool: () => Promise<PoolType<ModuleThreadType<TWorker>>>
) => {
  const workerPool = await getWorkerPool();
  const pool = {
    workerPool,
    promises: [],
    results: [],
    // runOnAllWorkers: <TMethod extends keyof TWorker>(workerMethod: TMethod, args: Parameters<TWorker[TMethod]>) =>
    //   Promise.all(threads.map(thread => thread[workerMethod](...args as any))),
    runOnAllWorkers: <TMethod extends keyof TWorker>(workerMethod: TMethod, args: Parameters<TWorker[TMethod]>) => {
      // @ts-ignore
      workerPool.workers.map(({ init }) => init.then(worker => worker[workerMethod](...args)))
    },
    schedule: <TMethod extends keyof TWorker>(workerMethod: TMethod, jobIndex: number, args: Parameters<TWorker[TMethod]>) => {
      pool.promises.push(
        workerPool.queue(worker => worker[workerMethod as any](...args as any))
          .then(results => {
            pool.results[jobIndex] = results;
          })
      );
    },
    getResults: async () => {
      await Promise.all(pool.promises);
      const results = pool.results;

      pool.promises = [];
      pool.results = [];

      return results;
    },
    close: async (force) => {
      if (force) {
        return workerPool.terminate(true);
      }
      await workerPool.completed();
      await workerPool.terminate();
    },
  };

  return pool;
};
