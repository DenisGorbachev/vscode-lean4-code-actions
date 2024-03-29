import { leanNameSeparator } from 'src/models/Lean/HieroName'
import { Position, TextEditor, window } from 'vscode'
import { lastOfIterator } from '../../libs/utils/IterableIterator/fun'

export function getImportInsertPosition(editor: TextEditor) {
  const { selection, document } = editor
  const { getText, positionAt } = document
  const text = getText()
  // // WARNING: The next line may result in the incorrect position being returned if the file contains `import` in some other location (not an import statement)
  // // TODO: Rewrite this hack
  const matches = text.matchAll(/^import\s/gm)
  const match = lastOfIterator(1024)(matches)
  if (match && match.index !== undefined) {
    const importPosition = positionAt(match.index)
    const nextLine = importPosition.line + 1
    return new Position(nextLine, 0)
  } else {
    return new Position(0, 0)
  }
}

export const getSelectionText = (editor: TextEditor) => {
  const { document, selection } = editor
  const { getText, getWordRangeAtPosition } = document
  if (selection.isEmpty) {
    const wordRange = getWordRangeAtPosition(selection.active)
    return wordRange ? getText(wordRange) : undefined
  } else {
    return getText(editor.selection)
  }
}

export const getSelectedNames = (editor: TextEditor) => {
  const text = getSelectionText(editor)
  if (text === undefined) return
  return text.split(leanNameSeparator)
}

/** TODO
 *  * Options
 *    * Implement a real parser for Lean name
 *    * Get the name-under-cursor from LSP
 */
export const getSelectedName = (editor: TextEditor) => {
  const names = getSelectedNames(editor)
  if (names === undefined) return
  return names[0]
}

export async function deleteSelection(editor: TextEditor) {
  await editor.edit(builder => builder.delete(editor.selection))
}

export const ensureEditor = () => {
  const { activeTextEditor } = window
  if (!activeTextEditor) throw new Error('No active editor found')
  return activeTextEditor
}
