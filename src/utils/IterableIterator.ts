export const toArray = <A>(iterator: IterableIterator<A>) => {
  const results: A[] = []
  for (const result of iterator) {
    results.push(result)
  }
  return results
}

export const map = <A, B>(mapper: (a: A) => B) => (iterator: IterableIterator<A>) => {
  const results: B[] = []
  for (const resultRaw of iterator) {
    results.push(mapper(resultRaw))
  }
  return results
}

export const lastOfIterator = (max: number = 1024) => <T>(iterator: IterableIterator<T>) => {
  let result: T | undefined = undefined
  let i = 0
  for (let item of iterator) {
    result = item
    i++
    if (i >= max) {return undefined}
  }
  return result
}
