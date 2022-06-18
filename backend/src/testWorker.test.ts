import { spawn, Thread, Worker, Pool } from 'threads';
import { getSharedTypedArray } from './typedArraysUtils';

describe('testWorker', () => {
  describe('single worker', () => {
    let workerInstance;
    beforeAll(async () => {
      workerInstance = await spawn(new Worker("./testWorker"));
    });
    afterAll(async () => {
      await Thread.terminate(workerInstance);
    });

    it('runs worker function', async () => {
      const results = await workerInstance.add(10, 23);
      expect(results).toBe(33);
    });
    it('runs worker function with object containing sharedArrays', async () => {
      const args = getSharedTypedArray([17, 23], Uint8Array);
      const results = getSharedTypedArray([0], Uint8Array);

      await workerInstance.complexObject({ args: args.buffer, results: results.buffer });

      expect(results[0]).toBe(40);
    })
    it('runs worker function passing shared arrays', async () => {
      const args = getSharedTypedArray([17, 23], Uint8Array);
      const results = getSharedTypedArray([0], Uint8Array);
      await workerInstance.addShared(args.buffer, results.buffer);
      await workerInstance.doubleShared(args.buffer);
      expect(results[0]).toBe(40);
      expect(args[0]).toBe(34);
      expect(args[1]).toBe(46);
    });
    it('stores state in worker', async () => {
      await workerInstance.setFoo(10);
      const results = await workerInstance.getFoo();
      expect(results).toBe(10);
    });
  });
  describe('worker pool', () => {
    let workerPool;
    const workers = [];
    beforeAll(async () => {
      workerPool = Pool(
        () => spawn(new Worker("./testWorker")),
        8
      );
    });
    afterAll(async () => {
      await workerPool.completed();
      await workerPool.terminate();
    });

    it('stores state in all workers', async () => {
      const result = await workerPool.queue(worker => worker.getFoo());
      expect(result).not.toBe(20);

      await Promise.all(workerPool.workers.map(({ init }) => init.then(worker => worker.setFoo(20))));
      const results = await Promise.all([
        workerPool.queue(worker => worker.getFoo()),
        workerPool.queue(worker => worker.getFoo()),
        workerPool.queue(worker => worker.getFoo()),
        workerPool.queue(worker => worker.getFoo()),
        workerPool.queue(worker => worker.getFoo()),
        workerPool.queue(worker => worker.getFoo()),
      ]);
      expect(results).toEqual([20, 20, 20, 20, 20, 20]);
    });

    it('runs scheduled tasks in worker', async () => {
      const results = await Promise.all([
        workerPool.queue(worker => worker.add(11, 58)),
        workerPool.queue(worker => worker.add(12, 120)),
      ]);

      expect(results).toEqual([69, 132]);
    });
    it('runs scheduled tasks in worker with shared arrays', async () => {
      const args = getSharedTypedArray([17, 23], Uint8Array);
      const results = getSharedTypedArray([0], Uint8Array);
      await workerPool.queue(worker => worker.addShared(args.buffer, results.buffer))
      workerPool.queue(worker => worker.doubleShared(args.buffer));
      workerPool.queue(worker => worker.doubleShared(args.buffer));

      await workerPool.completed();

      expect(results[0]).toBe(40);
      expect(args[0]).toBe(68);
      expect(args[1]).toBe(92);
    });
  });

});
