export const union = <T>(setA: Set<T>, setB: Set<T>) => {
  let _union = new Set(setA)
  for (let elem of setB) {
    _union.add(elem)
  }
  return _union;
}
