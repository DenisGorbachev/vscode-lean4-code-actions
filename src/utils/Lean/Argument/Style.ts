import { getArraySchema } from 'libs/utils/zod'
import { identity } from 'remeda'
import { z } from 'zod'

export const StyleSchema = z.enum([
  'explicit',
  'implicitStrong',
  'implicitWeak',
  'typeclass',
]).describe('Style')

export const StylesSchema = getArraySchema(StyleSchema, identity)

export type Style = z.infer<typeof StyleSchema>

export const parseStyle = (style: Style): Style => StyleSchema.parse(style)

export const parseStyles = (styles: Style[]): Style[] => StylesSchema.parse(styles)
