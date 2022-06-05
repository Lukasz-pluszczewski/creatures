import { getSharedTypedArray } from './typedArraysUtils';
import { copyDataStorage } from './memoryUtils';

describe('typedArraysUtils', () => {
  describe('getSharedTypedArray', () => {
    it('should return a typed array with the given elements', () => {
      const elements = [1, 2, 3, 10, 9, 8];
      const typedArray = new Uint8Array(elements);
      const sharedArray = getSharedTypedArray(elements, Uint8Array);
      expect(sharedArray.buffer).toBeInstanceOf(SharedArrayBuffer);
      expect(sharedArray).toEqual(typedArray);
      expect(sharedArray.length).toBe(elements.length);
      expect(typedArray.length).toBe(elements.length);
      typedArray.forEach((value, index) => {
        expect(value).toBe(sharedArray[index]);
      });
    });
  });
});
