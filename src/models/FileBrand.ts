import { getArraySchema } from 'libs/utils/zod'
import { equals, identity } from 'remeda'
import { z } from 'zod'

export const FileBrandSchema = z.enum([
  'type',
  'fun',
  'theorem',
  'tactic',
  'instance',
  'coe',
  'data',
  'example',
  'test',
  'macro',
  'misc',
]).describe('FileBrand')

export const FileBrandsSchema = getArraySchema(FileBrandSchema, identity)

export type FileBrand = z.infer<typeof FileBrandSchema>

export const parseFileBrand = (brand: FileBrand): FileBrand => FileBrandSchema.parse(brand)

export const parseFileBrands = (brand: FileBrand[]): FileBrand[] => FileBrandsSchema.parse(brand)

export const isEqualFileBrand = equals
