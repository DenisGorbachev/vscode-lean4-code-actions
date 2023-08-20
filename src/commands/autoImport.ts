import { longestCommonPrefix } from 'libs/utils/string'
import { flatten, last, sortBy } from 'remeda'
import { Name } from 'src/models/Lean/Name'
import { toHieroName, toString } from 'src/utils/Lean'
import { Location, getLocationFromUri } from 'src/utils/Lean/Lsp/WorkspaceSymbol'
import { LeanExports } from 'src/utils/LeanExtension'
import { isZero } from 'src/utils/Position'
import { ensureWorkspaceFolder } from 'src/utils/workspace'
import { extensions, window, workspace } from 'vscode'
import { WorkspaceSymbol } from 'vscode-languageserver-types'
import { GenericQuickPickItem } from '../utils/QuickPickItem'
import { ensureEditor, getImportInsertPosition, getSelectedName } from '../utils/TextEditor'
import { getLeanImportPathFromAbsoluteFilePath, getLeanNamesFromWorkspaceSymbolFilePath as getLeanNamesFromWorkspaceSymbolLocation, getRelativeFilePathFromAbsoluteFilePath } from '../utils/path'

export async function autoImport() {
  const editor = ensureEditor()
  const name = getSelectedName(editor)
  if (!name) throw new Error('Text selection is empty: please select the name for auto-import in the editor')
  const itemsArray = await Promise.all([
    getQuickPickItemsFromWorkspaceFiles(name),
    getQuickPickItemsFromWorkspaceSymbols(name),
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
    const suffix = isZero(insertPosition) ? '\n' : ''
    editBuilder.insert(insertPosition, `import ${leanImportPath}\n` + suffix)
  })
}

async function getQuickPickItemsFromWorkspaceFiles(name: string) {
  const names = toHieroName(name)
  const lastName = last(names)
  if (!lastName) throw new Error(`Cannot parse Lean name: "${name}"`)
  const uris = await workspace.findFiles(`**/*${lastName}.lean`, '{build,lake-packages}')
  return uris.map((uri, index): GenericQuickPickItem<Name> => {
    const workspaceFolder = ensureWorkspaceFolder(uri)
    return ({
      label: '$(file) ' + getRelativeFilePathFromAbsoluteFilePath(workspaceFolder.uri.fsPath, uri.fsPath),
      picked: index === 0,
      getValue: async () => getLeanImportPathFromAbsoluteFilePath(workspaceFolder.uri.fsPath, uri.fsPath),
    })
  })
}

const troubleshootLeanExtension = 'Troubleshoot: make sure that Lean server is running, make sure that Lean server has fully processed your file, try again.'

async function getQuickPickItemsFromWorkspaceSymbols(query: string) {
  const editor = ensureEditor()
  const leanExtensionId = 'leanprover.lean4'
  const leanExtension = extensions.getExtension(leanExtensionId)
  if (!leanExtension) throw new Error(`${leanExtensionId} extension is not available`)
  const { clientProvider } = leanExtension.exports as LeanExports
  if (!clientProvider) throw new Error(`${leanExtensionId} clientProvider is not available. ${troubleshootLeanExtension}`)
  const client = clientProvider.getActiveClient()
  if (!client) throw new Error(`${leanExtensionId} getActiveClient() is not available. ${troubleshootLeanExtension}`)
  const workspaceFolder = ensureWorkspaceFolder(editor.document.uri)
  const workspaceFolderPath = workspaceFolder.uri.fsPath
  const workspaceFolderUriStr = workspaceFolder.uri.toString()
  const symbols = await client.sendRequest('workspace/symbol', {
    query,
  }).catch((e) => {
    if (e instanceof Error) {
      window.showErrorMessage(e.toString())
      return
    } else {
      window.showErrorMessage(`Unknown error occurred while sending a request to LSP: ${e}`)
      return
    }
  }) as WorkspaceSymbol[] | null
  if (!symbols) throw new Error('Received a null response from LSP')
  const currentUriStr = editor.document.uri.toString()
  const workspaceFolderStr = workspaceFolder.uri.toString()
  const symbolsAnchored = symbols.filter(({ name }) => name.endsWith(query))
  const infosRaw = symbolsAnchored.map(({ name, location }) => {
    return ({
      name,
      uri: location.uri,
      closeness: longestCommonPrefix([currentUriStr, location.uri]).length,
    })
  })
  const infos = sortBy(
    infosRaw,
    [i => i.closeness, 'desc'],
    [i => i.name.startsWith(query), 'desc'],
    [i => i.name.length, 'asc'],
    [i => i.uri, 'desc']
  )
  return infos.map(({ name, uri }, index): GenericQuickPickItem<Name> => {
    const location = getLocationFromUri(workspaceFolderStr, uri)
    return ({
      label: '$(symbol-constructor) ' + name,
      description: getWorkspaceSymbolDescription(location),
      picked: index === 0,
      getValue: async () => toString(getLeanNamesFromWorkspaceSymbolLocation(location)),
    })
  })
}

const getWorkspaceSymbolDescription = (location: Location) => location.path
