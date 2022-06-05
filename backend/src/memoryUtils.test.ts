import { copyDataStorage, clearDataStorage, cloneDataStorage } from './memoryUtils';
import { getSharedTypedArray } from './typedArraysUtils';

describe('memoryUtils', () => {
  describe('copyDataStorage', () => {
    it('copies data from source to target', () => {
      const source = {
        a: new Uint8Array([1, 2, 3]),
        b: new Uint16Array([4, 5, 6]),
        c: new Uint32Array([7, 8, 9]),
      };
      const target = {
        a: new Uint8Array([0, 0, 0]),
        b: new Uint16Array([0, 0, 0]),
        c: new Uint32Array([0, 0, 0]),
      };
      copyDataStorage(source, target);
      expect(target).toEqual({
        a: new Uint8Array([1, 2, 3]),
        b: new Uint16Array([4, 5, 6]),
        c: new Uint32Array([7, 8, 9]),
      });
    });
    it('copies data from source to target with shared arrays', () => {
      const source = {
        a: getSharedTypedArray([1, 2, 3], Uint8Array),
        b: getSharedTypedArray([4, 5, 6], Uint16Array),
        c: getSharedTypedArray([7, 8, 9], Uint32Array),
      };
      const target = {
        a: getSharedTypedArray([0, 0, 0], Uint8Array),
        b: getSharedTypedArray([0, 0, 0], Uint16Array),
        c: getSharedTypedArray([0, 0, 0], Uint32Array),
      };
      copyDataStorage(source, target);
      expect(target).toEqual({
        a: getSharedTypedArray([1, 2, 3], Uint8Array),
        b: getSharedTypedArray([4, 5, 6], Uint16Array),
        c: getSharedTypedArray([7, 8, 9], Uint32Array),
      });
    });
  });
  describe('clearDataStorage', () => {
    it('clears data in target', () => {
      const target = {
        a: new Uint8Array([1, 2, 3]),
        b: new Uint16Array([4, 5, 6]),
        c: new Uint32Array([7, 8, 9]),
      };
      clearDataStorage(target);
      expect(target).toEqual({
        a: new Uint8Array([0, 0, 0]),
        b: new Uint16Array([0, 0, 0]),
        c: new Uint32Array([0, 0, 0]),
      });
    })
    it('clears data in target', () => {
      const target = {
        a: getSharedTypedArray([1, 2, 3], Uint8Array),
        b: getSharedTypedArray([4, 5, 6], Uint16Array),
        c: getSharedTypedArray([7, 8, 9], Uint32Array),
      };
      clearDataStorage(target);
      expect(target).toEqual({
        a: getSharedTypedArray([0, 0, 0], Uint8Array),
        b: getSharedTypedArray([0, 0, 0], Uint16Array),
        c: getSharedTypedArray([0, 0, 0], Uint32Array),
      });
    })
  });

  describe('copying typed arrays', () => {
    const elements = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const elementsEmpty = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    describe('structuredClone', () => {
      it('typed -> typed', () => {
        const source = { data: new Uint8Array(elements) };

        const target = structuredClone(source);

        source.data[0] = 100;

        expect(target.data[0]).toBe(1);
        expect(source.data[0]).toBe(100);
      });
      it('shared -> shared', () => {
        const source = { data: getSharedTypedArray(elements, Uint8Array) };

        const target = structuredClone(source);

        source.data[0] = 100;

        // structuredClone does not clone data from SharedArrayBuffers but copies the reference to the memory block
        expect(target.data[0]).toBe(100);
        expect(source.data[0]).toBe(100);
      });
    });

    describe('copyDataStorage', () => {
      it('typed -> typed', () => {
        const source = { data: new Uint8Array(elements) };
        const target = { data: new Uint8Array(elementsEmpty) };

        copyDataStorage(source, target);

        source.data[0] = 100;

        expect(target.data[0]).toBe(1);
        expect(source.data[0]).toBe(100);
      });
      it('shared -> shared', () => {
        const source = { data: getSharedTypedArray(elements, Uint8Array) };
        const target = { data: getSharedTypedArray(elementsEmpty, Uint8Array) };

        copyDataStorage(source, target);

        source.data[0] = 100;

        expect(target.data[0]).toBe(1);
        expect(source.data[0]).toBe(100);
      });
    });

    describe('cloneDataStorage', () => {
      it('typed -> typed', () => {
        const source = { data: new Uint8Array(elements) };

        const target = cloneDataStorage(source);

        source.data[0] = 100;

        expect(target.data[0]).toBe(1);
        expect(source.data[0]).toBe(100);
      });
      it('shared -> shared', () => {
        const source = { data: getSharedTypedArray(elements, Uint8Array) };

        const target = cloneDataStorage(source);

        source.data[0] = 100;

        expect(target.data[0]).toBe(1);
        expect(source.data[0]).toBe(100);
      });
    });
  });
});
