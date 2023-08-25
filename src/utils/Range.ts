import { Position, Range } from 'vscode'

export const getRangeFromOffsets = (positionAt: (offset: number) => Position) => (offsetLeft: number, offsetRight: number) => {
  return new Range(positionAt(offsetLeft), positionAt(offsetRight))
}
