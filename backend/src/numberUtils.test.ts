import { mapNumberToDifferentRange, clamp } from './numberUtils';
import { expectType } from 'tsd';

describe('numberUtils', () => {
  describe('mapNumberToDifferentRange', () => {
    it('should map a number to a different range', () => {
      expectType<number>(mapNumberToDifferentRange(0, 0, 1, 0, 100));
      expectType<number>(mapNumberToDifferentRange(0.5, 0, 1, 0, 100));
      expectType<number>(mapNumberToDifferentRange(1, 0, 1, 0, 100));

      expect(mapNumberToDifferentRange(0, 0, 1, 0, 100)).toBe(0);
      expect(mapNumberToDifferentRange(0.5, 0, 1, 0, 100)).toBe(50);
      expect(mapNumberToDifferentRange(1, 0, 1, 0, 100)).toBe(100);
    });
    it('maps a number to a different range, one positive and one negative', () => {
      expect(mapNumberToDifferentRange(0, 0, 1, -100, 0)).toBe(-100);
      expect(mapNumberToDifferentRange(0.5, 0, 1, -100, 0)).toBe(-50);
      expect(mapNumberToDifferentRange(1, 0, 1, -100, 0)).toBe(0);

      expect(mapNumberToDifferentRange(0, 0, 20, 1, 0)).toBe(1);
      expect(mapNumberToDifferentRange(20, 0, 20, 1, 0)).toBe(0);
    });
  });
  describe('clamp', () => {
    it('clamps a number', () => {
      expectType<number>(clamp(0, 0, 1));
      expectType<number>(clamp(0.5, 0, 1));
      expectType<number>(clamp(1, 0, 1));

      expect(clamp(0, 0, 1)).toBe(0);
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(1, 0, 1)).toBe(1);
      expect(clamp(20, 0, 1)).toBe(1);
      expect(clamp(-20, 0, 1)).toBe(0);
    });
  });
});
