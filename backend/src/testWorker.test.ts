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
    it('runs worker function passing shared arrays', async () => {
      const args = getSharedTypedArray([17, 23], Uint8Array);
      const results = getSharedTypedArray([0], Uint8Array);
      await workerInstance.addShared(args.buffer, results.buffer);
      await workerInstance.doubleShared(args.buffer);
      expect(results[0]).toBe(40);
      expect(args[0]).toBe(34);
      expect(args[1]).toBe(46);
    });
  });
  describe('worker pool', () => {
    let workerPool;
    beforeAll(async () => {
      workerPool = Pool(() => spawn(new Worker("./testWorker")), 8);
    });
    afterAll(async () => {
      await workerPool.completed();
      await workerPool.terminate();
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
