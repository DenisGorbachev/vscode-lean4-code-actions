import { todo } from 'libs/utils/todo'
import { getArraySchema } from 'libs/utils/zod'
import { equals, identity } from 'remeda'
import { z } from 'zod'

export const validateName = (name: string) => todo<string>()

export const NameSchema = z.string().refine(validateName).describe('Name')

export const NamesSchema = getArraySchema(NameSchema, identity)

export type Name = z.infer<typeof NameSchema>

export const parseName = (name: Name): Name => NameSchema.parse(name)

export const parseNames = (names: Name[]): Name[] => NamesSchema.parse(names)

export const isEqualName = equals
