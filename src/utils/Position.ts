import { Position } from 'vscode'

export function isZero(position: Position) {
  return position.line === 0 && position.character === 0
}
