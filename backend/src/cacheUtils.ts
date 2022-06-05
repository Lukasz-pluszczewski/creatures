export const getCachedValue = (cache, index: number, getter: () => any) =>
  cache[index] ? cache[index] : (cache[index] = getter());
