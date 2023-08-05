import { Position, Range, TextDocument } from "vscode"

export function getCurrentCodeBlockAt(position: Position, document: TextDocument) {
  const { getText, offsetAt, positionAt } = document
  const text = getText()
  const offset = offsetAt(position)
  const blockSeparators = text.matchAll(/(\n\s*)+\n/g)
  let blockStart: number = 0
  let blockEnd: number = text.length - 1
  for (const separator of blockSeparators) {
    if (!separator.index) { continue }
    if (separator.index < offset) {
      blockStart = separator.index + separator.length
    } else {
      blockEnd = separator.index + separator.length
      break
    }
  }
  return new Range(positionAt(blockStart), positionAt(blockEnd))
}
