import { escapeRegExp } from "lodash"
import { CancellationToken, Position, Range, TextDocument, TextEditor, WorkspaceEdit } from "vscode"
import { ensureEditor } from "../utils/TextEditor"
import { todo } from "../utils/todo"

// {
//   "command": "vscode-lean4-code-actions.renameLocalVariable",
//   "title": "Lean 4 Extra: Rename a local variable (using simple find-replace within a code block)",
//   "shortTitle": "Lean 4 Extra: Rename a local variable"
// },

export async function renameLocalVariable() {
  const editor = ensureEditor()
  const { document, selection } = editor
  const block = getCurrentCodeBlock(editor)
  const blockText = document.getText(block)
  const varText = document.getText(selection)
}

function getCurrentCodeBlock(editor: TextEditor) {
  return todo<Range>()
}

function getCurrentCodeBlockAt(position: Position, document: TextDocument) {
  const { getText, offsetAt, positionAt } = document
  const text = getText()
  const offset = offsetAt(position)
  const blockSeparators = text.matchAll(/(\n\s*)+\n/g)
  let blockStart: number = 0
  let blockEnd: number = text.length - 1
  for (const separator of blockSeparators) {
    if (!separator.index) continue
    if (separator.index < offset) {
      blockStart = separator.index
    } else {
      blockEnd = separator.index + separator.length
      break
    }
  }
  return new Range(positionAt(blockStart), positionAt(blockEnd))
}

export async function provideRenameEdits(document: TextDocument, position: Position, newName: string, token: CancellationToken) {
  if (!newName) throw new Error('New name must be non-empty')
  const { getText, getWordRangeAtPosition } = document
  const edit = new WorkspaceEdit()
  const blockRange = getCurrentCodeBlockAt(position, document)
  const blockText = getText(blockRange)
  const wordRange = getWordRangeAtPosition(position)
  const wordText = getText(wordRange)
  const notPrecededByWordCharacter = "(?<!\\w)"
  const notFollowedByWordCharacter = "(?!\\w)"
  const regexp = new RegExp(notPrecededByWordCharacter + escapeRegExp(wordText) + notFollowedByWordCharacter, "g")
  const blockTextNew = blockText.replace(regexp, newName)
  edit.replace(document.uri, blockRange, blockTextNew)
  return edit
}
