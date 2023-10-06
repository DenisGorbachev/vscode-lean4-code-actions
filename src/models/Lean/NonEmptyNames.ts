import { z } from 'zod'
import { NameSchema } from './Name'

export const NonEmptyNamesSchema = NameSchema.array().min(1).brand('NonEmptyNames')

export type NonEmptyNames = z.infer<typeof NonEmptyNamesSchema>

export const parseNonEmptyNames = (names: string[]): NonEmptyNames => NonEmptyNamesSchema.parse(names)
