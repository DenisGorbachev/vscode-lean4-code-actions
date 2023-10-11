import { toArray } from 'libs/utils/IterableIterator/fun'
import { isDefined } from 'remeda'
import { escapeRegExp } from 'voca'
import { CancellationToken, Position, TextDocument, WorkspaceEdit } from 'vscode'
import { replaceAtMulti } from '../../libs/utils/string'
import { getCurrentCodeBlockAt } from '../utils/TextDocument'

// {
//   "command": "lean4CodeActions.renameLocalVariable",
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
  const oldNameRange = getWordRangeAtPosition(position)
  const oldName = getText(oldNameRange)
  const blockTextNew = replaceViaWordPattern(oldName, blockText, newName)
  edit.replace(document.uri, blockRange, blockTextNew)
  return edit
}

function replaceBetweenNonWordCharacterDelimiters(oldName: string, blockText: string, newName: string) {
  const notPrecededByWordCharacter = '(?<!\\w)'
  const notFollowedByWordCharacter = '(?!\\w)'
  const regexp = new RegExp(notPrecededByWordCharacter + escapeRegExp(oldName) + notFollowedByWordCharacter, 'g')
  return blockText.replace(regexp, newName)
}

function replaceViaWordPattern(oldName: string, blockText: string, newName: string) {
  // NOTE: There is no way to get the wordPattern for the current language in VSCode, so we have to hardcode the RegExp here
  const wordPattern = new RegExp('[^`~@$%^&*()\\-=+\\[{\\]}⟨⟩⦃⦄⟦⟧⟮⟯‹›\\\\|;:",/\\s]+', 'g')
  const matches = blockText.matchAll(wordPattern)
  const matchesArray = toArray(matches)
  const indexes = matchesArray.filter(match => match[0] === oldName).map(match => match.index).filter(isDefined)
  return replaceAtMulti(blockText, newName, indexes, oldName.length)
}
