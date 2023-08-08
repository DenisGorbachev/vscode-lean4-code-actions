import { sep } from 'path'
import { identity } from 'remeda'
import { Uri, commands, workspace } from 'vscode'
import { ensureNames, toNamespace, toNamespaceDeclaration } from '../utils/Lean'
import { cloneRegExp } from '../utils/RegExp'
import { getCurrentCodeBlockAt } from '../utils/TextDocument'
import { ensureEditor } from '../utils/TextEditor'
import { doWriteFile, exists } from '../utils/file'
import { Line, Segment, combineAll } from '../utils/text'

const getMatcher = (r: RegExp) => (text: string) => text.match(r)
const getRegExpForLineStartingWith = (start: string) => new RegExp("^" + start + '.*', 'gm')

const importRegExp = getRegExpForLineStartingWith('import')
const openRegExp = getRegExpForLineStartingWith('open')
const getImports = getMatcher(importRegExp)
const getOpens = getMatcher(openRegExp)

export async function moveDefinitionToNewFile() {
  const editor = ensureEditor()
  const { document } = editor
  const { getText, positionAt } = document
  const textAll = getText()
  const allImports = getImports(textAll) || []
  const allOpens = getOpens(textAll) || []
  const block = getCurrentCodeBlockAt(editor.selection.active, document)
  const blockText = getText(block)
  const currentNames = ensureNames(document.uri).slice(0, -1)
  const selectionNames = getSelectionNames(blockText)
  const fullNames = currentNames.concat(selectionNames)
  const relativeFilePath = getRelativeFilePathFromNames(fullNames)
  const absoluteFilePath = getAbsoluteFilePathFromRelativeFilePath(document.uri, relativeFilePath)
  if (absoluteFilePath === document.uri.fsPath) throw new Error(`The definition belongs to this file. See the extension docs for more details."`)
  if (await exists(absoluteFilePath)) throw new Error(`Cannot overwrite a file that already exists: "${relativeFilePath}"`)
  // Create a new file
  const content = getContent(allImports, allOpens)(blockText)(currentNames, selectionNames)
  await doWriteFile(absoluteFilePath, content)
  // Edit the current file
  const closestImportLastIndex = getLastIndexMatchBefore(importRegExp, document.offsetAt(editor.selection.active), textAll)
  const importInsertOffset = closestImportLastIndex ? closestImportLastIndex + 1 : 0
  await editor.edit(builder => {
    builder.delete(block)
    builder.insert(positionAt(importInsertOffset), `import ${toNamespace(fullNames)}\n`)
  })
  // Open the new file
  await commands.executeCommand('vscode.open', Uri.file(absoluteFilePath))
}

function getRelativeFilePathFromNames(names: string[]) {
  return names.join(sep) + '.lean'
}

function getAbsoluteFilePathFromRelativeFilePath(uri: Uri, localFilePath: string) {
  const workspaceFolder = workspace.getWorkspaceFolder(uri)
  if (!workspaceFolder) throw new Error(`Cannot get a workspace folder for the file uri: "${uri}"`)
  return workspaceFolder.uri.fsPath + sep + localFilePath
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
  segments.push([toNamespaceDeclaration(globalNames)])
  segments.push([selection.trim()])
  segments.push([toNamespaceDeclaration(localNames)])
  return combineAll(segments)
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

