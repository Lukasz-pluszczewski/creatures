export const omitPick = <
  TObject extends { [key: string]: unknown },
  TOmit extends keyof TObject = never,
  TPick extends keyof TObject = keyof TObject,
>(
  object: TObject,
  { omit, pick }: { omit?: TOmit[], pick?: TPick[] } = {},
) => {
  return Object.keys(object)
    .reduce((acc, key) => {
      if (omit && omit.length && (omit as string[]).includes(key)) {
        return acc;
      }
      if (pick && pick.length && !(pick as string[]).includes(key)) {
        return acc;
      }
      acc[key] = object[key];
      return acc;
    }, {} as Omit<Pick<TObject, TPick>, TOmit>);
};
