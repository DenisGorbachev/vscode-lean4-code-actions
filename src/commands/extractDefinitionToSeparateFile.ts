import { sep } from 'path'
import { identity } from 'remeda'
import { withWorkspaceEdit } from 'src/utils/WorkspaceEdit'
import { getUriFromLeanNames } from 'src/utils/WorkspaceFolder'
import { ensureWorkspaceFolder } from 'src/utils/workspace'
import { commands } from 'vscode'
import { toString } from '../models/Lean/HieroName'
import { ensureNames, toNamespace } from '../utils/Lean'
import { cloneRegExp } from '../utils/RegExp'
import { getCurrentCodeBlockAt } from '../utils/TextDocument'
import { ensureEditor } from '../utils/TextEditor'
import { Line, Segment, combineFileContent } from '../utils/text'

const getMatcher = (r: RegExp) => (text: string) => text.match(r)
const getRegExpForLineStartingWith = (start: string) => new RegExp('^' + start + '.*', 'gm')

const importRegExp = getRegExpForLineStartingWith('import')
const openRegExp = getRegExpForLineStartingWith('open')
const getImports = getMatcher(importRegExp)
const getOpens = getMatcher(openRegExp)

export async function extractDefinitionToSeparateFile() {
  const editor = ensureEditor()
  const { document } = editor
  const { getText, positionAt } = document
  const workspaceFolder = ensureWorkspaceFolder(document.uri)
  const textAll = getText()
  const allImports = getImports(textAll) || []
  const allOpens = getOpens(textAll) || []
  const block = getCurrentCodeBlockAt(editor.selection.active, document)
  const blockText = getText(block)
  const currentNames = ensureNames(document.uri).slice(0, -1)
  const selectionNames = getSelectionNames(blockText)
  const fullNames = currentNames.concat(selectionNames)
  const uri = getUriFromLeanNames(workspaceFolder, fullNames)
  // const relativeFilePath = getRelativeFilePathFromNames(fullNames)
  // const absoluteFilePath = getAbsoluteFilePathFromRelativeFilePath(document.uri, relativeFilePath)
  // if (absoluteFilePath === document.uri.fsPath) throw new Error('The definition belongs to this file. See the extension docs for more details."')
  // Create a new file
  const content = getContent(allImports, allOpens)(blockText)(currentNames, selectionNames)
  const closestImportLastIndex = getLastIndexMatchBefore(importRegExp, document.offsetAt(editor.selection.active), textAll)
  const importInsertOffset = closestImportLastIndex ? closestImportLastIndex + 1 : 0
  const importInsertSuffix = importInsertOffset === 0 ? '\n' : ''
  await withWorkspaceEdit(async edit => {
    edit.createFile(uri, { contents: Buffer.from(content) })
    edit.delete(document.uri, block)
    edit.insert(document.uri, positionAt(importInsertOffset), `import ${toString(fullNames)}\n` + importInsertSuffix)
  })
  await commands.executeCommand('vscode.open', uri)
}

function getRelativeFilePathFromNames(names: string[]) {
  return names.join(sep) + '.lean'
}

const getSelectionNames = (selection: string) => {
  // TODO: Rewrite this hack
  const namespacesRaw = getSecondStringWithoutSpaces(selection)
  if (!namespacesRaw) throw new Error('Selection is invalid: it does not contain any Lean names')
  return namespacesRaw.split('.')
}

const getContent = (allImports: Line[], allOpens: Line[]) => (selection: string) => (globalNames: string[], localNames: string[]) => {
  // const filePath = uri.toString();
  const segments: Segment[] = []
  segments.push(allImports)
  segments.push(allOpens)
  segments.push([toNamespace(globalNames)])
  segments.push([selection.trim()])
  segments.push([toNamespace(localNames)])
  return combineFileContent(segments)
}

function getSecondStringWithoutSpaces(selection: string) {
  return selection
    .split(' ')
    .map(s => s.trim())
    .filter(identity)
    .at(1)
}

function getLastIndexMatchBefore(regexp: RegExp, index: number, text: string) {
  const r = cloneRegExp(regexp)
  let prevIndex: number | undefined = undefined
  while (r.exec(text)) {
    if (r.lastIndex > index) {
      break
    } else {
      prevIndex = r.lastIndex
    }
  }
  return prevIndex
}

