import { BitArray, getSharedTypedArray } from './typedArraysUtils';
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

  describe('bitArray', () => {
    it('accepts number constructor argument', () => {
      const instance = new BitArray(10);
      instance[0] = 1;
      instance[2] = 8;
      instance[5] = true;
      instance[5] = 0;
      instance[9] = true;

      expect(instance.length).toBe(10);
      expect(instance.byteLength).toBe(2);
      expect(instance[0]).toBe(true);
      expect(instance[1]).toBe(false);
      expect(instance[2]).toBe(true);
      expect(instance[3]).toBe(false);
      expect(instance[4]).toBe(false);
      expect(instance[5]).toBe(false);
      expect(instance[6]).toBe(false);
      expect(instance[7]).toBe(false);
      expect(instance[8]).toBe(false);
      expect(instance[9]).toBe(true);
    });
    it('accepts values constructor argument', () => {
      const instance = new BitArray([true, false, 8, 0, 0, 1, 0, 0, 0, true]);
      instance[5] = 0;

      expect(instance.length).toBe(10);
      expect(instance.byteLength).toBe(2);
      expect(instance[0]).toBe(true);
      expect(instance[1]).toBe(false);
      expect(instance[2]).toBe(true);
      expect(instance[3]).toBe(false);
      expect(instance[4]).toBe(false);
      expect(instance[5]).toBe(false);
      expect(instance[6]).toBe(false);
      expect(instance[7]).toBe(false);
      expect(instance[8]).toBe(false);
      expect(instance[9]).toBe(true);
    });
    it('accepts BitArray constructor argument', () => {
      const bitArray = new BitArray([true, false, 8, 0, 0, 1, 0, 0, 0, true]);
      const instance = new BitArray(bitArray);
      instance[5] = 0;

      expect(instance.length).toBe(10);
      expect(instance.byteLength).toBe(2);
      expect(instance[0]).toBe(true);
      expect(instance[1]).toBe(false);
      expect(instance[2]).toBe(true);
      expect(instance[3]).toBe(false);
      expect(instance[4]).toBe(false);
      expect(instance[5]).toBe(false);
      expect(instance[6]).toBe(false);
      expect(instance[7]).toBe(false);
      expect(instance[8]).toBe(false);
      expect(instance[9]).toBe(true);
    });
    it('accepts ArrayBuffer constructor argument', () => {
      const instance = new BitArray(new ArrayBuffer(2));
      instance[0] = 1;
      instance[2] = 8;
      instance[5] = true;
      instance[5] = 0;
      instance[9] = true;

      expect(instance.length).toBe(16);
      expect(instance.byteLength).toBe(2);
      expect(instance[0]).toBe(true);
      expect(instance[1]).toBe(false);
      expect(instance[2]).toBe(true);
      expect(instance[3]).toBe(false);
      expect(instance[4]).toBe(false);
      expect(instance[5]).toBe(false);
      expect(instance[6]).toBe(false);
      expect(instance[7]).toBe(false);
      expect(instance[8]).toBe(false);
      expect(instance[9]).toBe(true);
    });
  });
});
