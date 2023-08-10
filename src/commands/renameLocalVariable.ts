import { escapeRegExp } from 'voca'
import { CancellationToken, Position, TextDocument, WorkspaceEdit } from 'vscode'
import { getCurrentCodeBlockAt } from '../utils/TextDocument'

// {
//   "command": "vscode-lean4-code-actions.renameLocalVariable",
//   "title": "Lean 4 Extra: Rename a local variable (using simple find-replace within a code block)",
//   "shortTitle": "Lean 4 Extra: Rename a local variable"
// },

// export async function renameLocalVariable() {
//   const editor = ensureEditor()
//   const { document, selection } = editor
//   const block = getCurrentCodeBlock(editor)
//   const blockText = document.getText(block)
//   const varText = document.getText(selection)
// }

// function getCurrentCodeBlock(editor: TextEditor) {
//   return todo<Range>()
// }

export async function provideRenameEdits(document: TextDocument, position: Position, newName: string, token: CancellationToken) {
  if (!newName) { throw new Error('New name must be non-empty') }
  const { getText, getWordRangeAtPosition } = document
  const edit = new WorkspaceEdit()
  const blockRange = getCurrentCodeBlockAt(position, document)
  const blockText = getText(blockRange)
  const wordRange = getWordRangeAtPosition(position)
  const wordText = getText(wordRange)
  const notPrecededByWordCharacter = '(?<!\\w)'
  const notFollowedByWordCharacter = '(?!\\w)'
  const regexp = new RegExp(notPrecededByWordCharacter + escapeRegExp(wordText) + notFollowedByWordCharacter, 'g')
  const blockTextNew = blockText.replace(regexp, newName)
  edit.replace(document.uri, blockRange, blockTextNew)
  return edit
}
