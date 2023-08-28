import { Position, Range } from 'vscode'

export const getRangeFromOffsets = (positionAt: (offset: number) => Position) => (offsetLeft: number, offsetRight: number) => {
  return new Range(positionAt(offsetLeft), positionAt(offsetRight))
}

export const getRangeFromOffsetAndLength = (positionAt: (offset: number) => Position) => (offset: number, length: number) => {
  return new Range(positionAt(offset), positionAt(offset + length))
}
