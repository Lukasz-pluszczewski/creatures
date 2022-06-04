import { copyDataStorage, clearDataStorage } from './memoryUtils';

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
})
