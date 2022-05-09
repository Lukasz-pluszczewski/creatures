import { omitPick } from './objectUtils';
import { expectType } from 'tsd';

describe('objectUtils', () => {
  describe('omitPick', () => {
    it('omit and pick properties and return new object', () => {
      const obj = { foo: 1, bar: '2', baz: { value: 3 }, bam: [4], baq: () => 5 };

      const result1 = omitPick(obj, { omit: ['baz', 'bam', 'baq'], pick: ['bar', 'baz'] });
      expectType<{ bar: string }>(result1);
      expect(result1).toEqual({
        bar: '2',
      });

      const result2 = omitPick(obj, { pick: ['bar', 'baz'] });
      expectType<{ bar: string, baz: { value: number } }>(result2);
      expect(result2).toEqual({
        bar: '2',
        baz: { value: 3 },
      });

      const result3 = omitPick(obj, { omit: ['baz', 'bam', 'baq'] });
      expectType<{ foo: number, bar: string }>(result3);
      expect(result3).toEqual({
        foo: 1,
        bar: '2',
      });

      const result4 = omitPick(obj, {});
      expectType<typeof obj>(result4);
      expect(result4).toEqual(obj);
      expect(result4).not.toBe(obj);
    });
  });
});
