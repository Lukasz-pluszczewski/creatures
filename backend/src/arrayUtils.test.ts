import { iterateOverRange } from './arrayUtils';

describe('arrayUtils', () => {
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
});
