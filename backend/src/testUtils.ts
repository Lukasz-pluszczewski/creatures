export const areDistinct = (list: any[]) => {
  const set = new Set(list);
  return list.length === set.size;
};
