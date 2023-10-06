import { NonEmptyArray } from 'libs/utils/array/ensureNonEmptyArray'
import { todo } from 'libs/utils/todo'
import { getArraySchema } from 'libs/utils/zod'
import { equals, identity, last } from 'remeda'
import { z } from 'zod'

/**
  ident: atomic_ident | ident "." atomic_ident
  atomic_ident: atomic_ident_start atomic_ident_rest*
  atomic_ident_start: letterlike | "_" | escaped_ident_part
  letterlike: [a-zA-Z] | greek | coptic | letterlike_symbols
  greek: <[α-ωΑ-Ωἀ-῾] except for [λΠΣ]>
  coptic: [ϊ-ϻ]
  letterlike_symbols: [℀-⅏]
  escaped_ident_part: "«" [^«»\r\n\t]* "»"
  atomic_ident_rest: atomic_ident_start | [0-9'ⁿ] | subscript
  subscript: [₀-₉ₐ-ₜᵢ-ᵪ]
*/
export const allowedCharactersRegExp = new RegExp('[a-zA-Z0-9_?!\']')

export const validateName = (name: string) => todo<string>()

export const NameSchema = z.string().refine(validateName).describe('Name')

export const NamesSchema = getArraySchema(NameSchema, identity)

export type Name = z.infer<typeof NameSchema>

export const parseName = (name: Name): Name => NameSchema.parse(name)

export const parseNames = (names: Name[]): Name[] => NamesSchema.parse(names)

export const isEqualName = equals

export function splitNames(names: NonEmptyArray<Name>): [Name[], Name] {
  const namespace = names.slice(0, -1)
  const name = last(names)
  return [namespace, name]
}
