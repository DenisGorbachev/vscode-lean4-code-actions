import { getArraySchema } from 'libs/utils/zod'
import { equals, identity } from 'remeda'
import { z } from 'zod'

export const NewTypeKeywordSchema = z.enum([
  'structure',
  'inductive',
  'class',
  'abbrev',
  'def',
]).describe('NewTypeKeyword')

export const NewTypeKeywordsSchema = getArraySchema(NewTypeKeywordSchema, identity)

export type NewTypeKeyword = z.infer<typeof NewTypeKeywordSchema>

export const parseNewTypeKeyword = (keyword: NewTypeKeyword): NewTypeKeyword => NewTypeKeywordSchema.parse(keyword)

export const parseNewTypeKeywords = (keywords: NewTypeKeyword[]): NewTypeKeyword[] => NewTypeKeywordsSchema.parse(keywords)

export const isEqualNewTypeKeyword = equals
