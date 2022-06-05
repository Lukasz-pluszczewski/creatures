import {
  batch,
  times,
  timesAsync,
  timesBatch,
  timesAsyncBatch,
  iterateOverRange,
  iterateOverRangeAsync,
  iterateOverRangeAsyncBatch,
  forEachAsync,
  mapAsync,
  untilTruthy,
  untilTruthyAsync,
} from './arrayUtils';

describe('arrayUtils', () => {
  describe('batch', () => {
    it('divides an array into batches of the given length', () => {
      const batches = batch([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
      expect(batches).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });
  });

  describe('times', () => {
    it('runs cb n times', () => {
      const result = [];
      times(6, (index) => {
        result.push(index);
      });
      expect(result).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });
  describe('timesAsync', () => {
    it('runs cb n times', async () => {
      const array = [0, 50, 60, 70, 10, 20, 30, 40, 80, 90];
      const result = [];
      await timesAsync(6, async (index) => new Promise(resolve => {
        setTimeout(() => {
          result.push(array[index]);
          resolve();
        }, array[index]);
      }));
      expect(result).toEqual([0, 50, 60, 70, 10, 20]);
    });
  });

  describe('timesBatch', () => {
    it('runs cb n times with batches of data', () => {
      const result = [];
      timesBatch(7, 3, (batch) => {
        result.push(batch);
      });
      expect(result).toEqual([[0, 1, 2], [3, 4, 5], [6]]);
    });
  });
  describe('timesBatchAsync', () => {
    it('runs cb n times with batches of data', async () => {
      const array = [0, 50, 60, 70, 10, 20, 30, 40, 80, 90];
      const result = [];
      await timesAsyncBatch(7, 3, async (batch) => new Promise(resolve => {
        setTimeout(() => {
          result.push(batch.map(index => array[index]));
          resolve();
        }, array[batch[0]]);
      }));
      expect(result).toEqual([[0, 50, 60], [70, 10, 20], [30]]);
    });
  });

  describe('iterateOverRange', () => {
    it('iterates over range', () => {
      const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = [];
      iterateOverRange(1, 6, (index) => {
        result.push(array[index]);
      });
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
  describe('iterateOverRangeAsync', () => {
    it('iterates over range', async () => {
      const array = [0, 50, 60, 70, 10, 20, 30, 40, 80, 90];
      const result = [];
      await iterateOverRangeAsync(1, 6, async (index) => new Promise(resolve => {
        setTimeout(() => {
          result.push(array[index]);
          resolve();
        }, array[index]);
      }));
      expect(result).toEqual([50, 60, 70, 10, 20, 30]);
    });
  });
  describe('iterateOverRangeAsyncBatch', () => {
    it('iterates over range', async () => {
      const array = [0, 50, 60, 70, 10, 20, 30, 40, 80, 90];
      const result = [];
      await iterateOverRangeAsyncBatch(1, 7, 3, async (batch) => new Promise(resolve => {
        setTimeout(() => {
          result.push(batch.map(index => array[index]));
          resolve();
        }, array[batch[0]]);
      }));
      expect(result).toEqual([[50, 60, 70], [10, 20, 30], [40]]);
    });
  });
  describe('forEachAsync', () => {
    it('iterates over range', async () => {
      const array = [0, 50, 60, 70, 10, 20, 30, 40, 80, 90];
      const result = [];
      await forEachAsync(array, async value => new Promise(resolve => {
        setTimeout(() => {
          result.push(value);
          resolve();
        }, value);
      }));
      expect(result).toEqual(array);
    });
  });
  describe('mapAsync', () => {
    it('iterates over range', async () => {
      const array = [0, 50, 60, 70, 10, 20, 30, 40, 80, 90];
      const result = await mapAsync(array, async value => new Promise(resolve => {
        setTimeout(() => {
          resolve(value);
        }, value);
      }));
      expect(result).toEqual(array);
    });
  });

  describe('untilTruthy', () => {
    it('iterates over array as long as values are truthy', async () => {
      const array = [false, true, 'true', 1, '', false, null, 10];
      const result = [];
      untilTruthy(array, index => {
        result.push(index);
      }, 1);
      expect(result).toEqual([1, 2, 3]);
    });
  });
  describe('untilTruthyAsync', () => {
    it('iterates over array as long as values are truthy', async () => {
      const array = [false, true, 'true', 1, '', false, null, 10];
      const result = [];
      await untilTruthyAsync(array, async (index) => new Promise(resolve => {
        setTimeout(() => {
          result.push(index);
          resolve();
        }, index * 10);
      }), 1);
      expect(result).toEqual([1, 2, 3]);
    });
  });
});
