import { Name } from 'src/models/Lean/Name'

export type HieroName = Name[]

export const leanNameSeparator = '.'

export const toHieroName = (namespace: string): HieroName => namespace.split(leanNameSeparator)

export const toString = (names: HieroName): string => names.join(leanNameSeparator)
