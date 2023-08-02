export const lastOfIterator = (max: number = 1024) => <T>(iterator: IterableIterator<T>) => {
  let result: T | undefined = undefined;
  let i = 0;
  for (let item of iterator) {
    result = item;
    i++;
    if (i >= max) return undefined;
  }
  return result;
};
