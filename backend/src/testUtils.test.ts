import { areDistinct } from './testUtils';

describe('areDistinct', () => {
  it('detects duplicates in array', () => {
    expect(areDistinct([1, 2, 3, 4, 5])).toEqual(true);
    expect(areDistinct([1, 2, 3, 2, 4, 5])).toEqual(false);
    expect(areDistinct([1000, 2000, -2000, 200, 1, 2])).toEqual(true);
    expect(areDistinct([1000, 2000, -2000, 200, 1, 2, -2000])).toEqual(false);
  });
});
