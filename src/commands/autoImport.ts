import { flatten, last, sortBy } from 'remeda'
import { Name } from 'src/models/Lean/Name'
import { toNames, toNamespace } from 'src/utils/Lean'
import { LeanExports } from 'src/utils/LeanExtension'
import { ensureWorkspaceFolder } from 'src/utils/workspace'
import { extensions, window, workspace } from 'vscode'
import { WorkspaceSymbol } from 'vscode-languageserver-types'
import { GenericQuickPickItem } from '../utils/QuickPickItem'
import { ensureEditor, getImportInsertPosition, getSelectedName } from '../utils/TextEditor'
import { getLeanImportPathFromAbsoluteFilePath, getLeanNamesFromMaybeLakeRelativeFilePath, getRelativeFilePathFromAbsoluteFilePath } from '../utils/path'
import { longestCommonPrefix } from '../utils/string'

export async function autoImport() {
  const editor = ensureEditor()
  const name = getSelectedName(editor)
  if (!name) throw new Error(`Text selection is empty: please select the name for auto-import in the editor`)
  const itemsArray = await Promise.all([
    getQuickPickItemsFromWorkspaceFiles(name),
    getQuickPickItemsFromWorkspaceSymbols(name)
  ])
  const items = flatten(itemsArray)
  const result = await window.showQuickPick(items, {
    placeHolder: 'Pick a symbol',
    matchOnDescription: true,
  })
  if (!result) return // user cancelled the action
  const leanImportPath = await result.getValue()
  const insertPosition = getImportInsertPosition(editor)
  editor.edit(editBuilder => {
    editBuilder.insert(insertPosition, `import ${leanImportPath}\n`)
  })
}

async function getQuickPickItemsFromWorkspaceFiles(name: string) {
  const names = toNames(name)
  const lastName = last(names)
  if (!lastName) throw new Error(`Cannot parse Lean name: "${name}"`)
  const uris = await workspace.findFiles(`**/*${lastName}.lean`, '{build,lake-packages}')
  return uris.map((uri, index): GenericQuickPickItem<Name> => {
    const workspaceFolder = ensureWorkspaceFolder(uri)
    return ({
      label: '$(file) ' + getRelativeFilePathFromAbsoluteFilePath(workspaceFolder.uri.fsPath, uri.fsPath),
      picked: index === 0,
      getValue: async () => getLeanImportPathFromAbsoluteFilePath(workspaceFolder.uri.fsPath, uri.fsPath)
    })
  })
}

async function getQuickPickItemsFromWorkspaceSymbols(query: string) {
  const editor = ensureEditor()
  const leanExtensionId = 'leanprover.lean4'
  const leanExtension = extensions.getExtension(leanExtensionId)
  if (!leanExtension) throw new Error(`${leanExtensionId} extension is not available`)
  const { clientProvider } = leanExtension.exports as LeanExports
  if (!clientProvider) throw new Error(`${leanExtensionId} extension.clientProvider is not available`)
  const client = clientProvider.getActiveClient()
  if (!client) throw new Error(`${leanExtensionId} extension.clientProvider.getActiveClient() is not available`)
  const workspaceFolder = ensureWorkspaceFolder(editor.document.uri)
  const workspaceFolderPath = workspaceFolder.uri.fsPath
  const workspaceFolderUriStr = workspaceFolder.uri.toString()
  const symbols: WorkspaceSymbol[] | null = await client.sendRequest('workspace/symbol', {
    query
  }).catch((e) => {
    if (e instanceof Error) {
      window.showErrorMessage(e.toString())
      return
    } else {
      window.showErrorMessage(`Unknown error occurred while sending a request to LSP: ${e}`)
      return
    }
  })
  if (!symbols) throw new Error(`Received a null response from LSP`)
  const currentPath = getRelativeFilePathFromAbsoluteFilePath(workspaceFolderPath, editor.document.fileName)
  const symbolsAnchored = symbols.filter(({ name }) => name.endsWith(query))
  const infosRaw = symbolsAnchored.map(({ name, location }) => {
    const path = getRelativeFilePathFromAbsoluteFilePath(workspaceFolderUriStr, location.uri)
    return ({
      name,
      path,
      closeness: longestCommonPrefix([currentPath, path]).length
    })
  })
  const infos = sortBy(
    infosRaw,
    [i => i.closeness, 'desc'],
    [i => i.name.startsWith(query), 'desc'],
    [i => i.name.length, 'asc'],
    [i => i.path, 'desc']
  )
  return infos.map((symbol, index): GenericQuickPickItem<Name> => ({
    label: '$(symbol-constructor) ' + symbol.name,
    description: symbol.path,
    picked: index === 0,
    getValue: async () => toNamespace(getLeanNamesFromMaybeLakeRelativeFilePath(symbol.path))
  }))
}

