import { isEqualByDC } from 'libs/utils/lodash'
import { getArraySchema } from 'libs/utils/zod'
import { z } from 'zod'
import { FileBrandSchema } from './FileBrand'
import { NewTypeKeywordSchema } from './NewTypeKeyword'

export const FileContentVarietySchema = z.object({
  brand: FileBrandSchema.nullable(),
  keyword: NewTypeKeywordSchema.nullable(),
}).describe('FileContentVariety')

export const FileContentVarietyUidSchema = FileContentVarietySchema.pick({

})

export const FileContentVarietysSchema = getArraySchema(FileContentVarietySchema, parseFileContentVarietyUid)

export type FileContentVariety = z.infer<typeof FileContentVarietySchema>

export type FileContentVarietyUid = z.infer<typeof FileContentVarietyUidSchema>

export function parseFileContentVariety(variety: FileContentVariety): FileContentVariety {
  return FileContentVarietySchema.parse(variety)
}

export function parseFileContentVarietys(varieties: FileContentVariety[]): FileContentVariety[] {
  return FileContentVarietysSchema.parse(varieties)
}

export function parseFileContentVarietyUid(varietyUid: FileContentVarietyUid): FileContentVarietyUid {
  return FileContentVarietyUidSchema.parse(varietyUid)
}

export const isEqualFileContentVariety = isEqualByDC(parseFileContentVarietyUid)
