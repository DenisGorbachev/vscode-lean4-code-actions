import { trim } from 'libs/utils/array/trim'
import { isEmpty } from 'voca'

export type Line = string

export type Segment = Line[]

export const trimEmpty = trim<string>(isEmpty)

export const join = (count: number = 1) => (lines: string[]) => lines.join('\n'.repeat(count))

export const glue = join(1)

export const combine = join(2)

export const joinAll = (count: number = 1) => (segments: Segment[]) => join(count)(segments.map(s => s.join('\n')))

export const glueAll = joinAll(1)

export const combineAll = joinAll(2)

export const combineAllTrim = (segments: Segment[]) => combineAll(segments.map(trimEmpty)).trim()

export const joinAllSegments = (segmentsArray: Segment[][]) => joinAll(2)(segmentsArray.flat())

export const combineFileContent = (segments: Segment[]) => combineAllTrim(segments) + '\n'
