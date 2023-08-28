import { longestCommonPrefix } from 'libs/utils/string'
import { flatten, last, sortBy } from 'remeda'
import { toHieroName, toString } from 'src/models/Lean/HieroName'
import { Name } from 'src/models/Lean/Name'
import { Precint, PrecintType, getPrecintFromUri } from 'src/utils/Lean/Lsp/WorkspaceSymbol'
import { LeanExports } from 'src/utils/LeanExtension'
import { isZero } from 'src/utils/Position'
import { UriString } from 'src/utils/Uri'
import { ensureWorkspaceFolder } from 'src/utils/workspace'
import { extensions, window, workspace } from 'vscode'
import { WorkspaceSymbol } from 'vscode-languageserver-types'
import { StaticQuickPickItem } from '../utils/QuickPickItem'
import { ensureEditor, getImportInsertPosition, getSelectedName } from '../utils/TextEditor'
import { getLeanImportPathFromAbsoluteFilePath, getLeanNamesFromWorkspaceSymbolFilePath, getRelativeFilePathFromAbsoluteFilePath } from '../utils/path'

interface AutoImportQuickPickValue {
  title: string
  uri: UriString
  getValue: () => Promise<Name>
}

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
  const leanImportPath = await result.value.getValue()
  const insertPosition = getImportInsertPosition(editor)
  editor.edit(editBuilder => {
    const suffix = isZero(insertPosition) ? '\n' : ''
    editBuilder.insert(insertPosition, `import ${leanImportPath}\n` + suffix)
  })
}

const getQuickPickItemsFromWorkspaceFiles = async (name: string) => {
  const editor = ensureEditor()
  const documentUriStr = editor.document.uri.toString()
  const names = toHieroName(name)
  const lastName = last(names)
  if (!lastName) throw new Error(`Cannot parse Lean name: "${name}"`)
  const uris = await workspace.findFiles(`**/*${lastName}.lean`, '{build,lake-packages}')
  const infosRaw = uris.map(uri => {
    const workspaceFolder = ensureWorkspaceFolder(uri)
    const title = getRelativeFilePathFromAbsoluteFilePath(workspaceFolder.uri.fsPath, uri.fsPath)
    const value = getLeanImportPathFromAbsoluteFilePath(workspaceFolder.uri.fsPath, uri.fsPath)
    const uriStr = uri.toString()
    return {
      title,
      uri: uriStr,
      value,
      closeness: longestCommonPrefix([documentUriStr, uriStr]).length,
    }
  })
  const infos = sortBy(
    infosRaw,
    [i => i.closeness, 'desc'],
    [i => i.title.length, 'asc'],
    [i => i.uri, 'desc']
  )
  return infos.map((info, index): StaticQuickPickItem<AutoImportQuickPickValue> => {
    const { title, uri, value } = info
    return ({
      label: '$(file) ' + title,
      picked: index === 0,
      value: {
        title,
        uri,
        getValue: async () => value,
      },
    })
  })
}

const troubleshootLeanExtension = 'Troubleshoot: make sure that Lean server is running, make sure that Lean server has fully processed your file, try again.'

async function getQuickPickItemsFromWorkspaceSymbols(query: string) {
  const leanExtensionId = 'leanprover.lean4'
  const leanExtension = extensions.getExtension(leanExtensionId)
  if (!leanExtension) throw new Error(`${leanExtensionId} extension is not available`)
  const { clientProvider } = leanExtension.exports as LeanExports
  if (!clientProvider) throw new Error(`${leanExtensionId} clientProvider is not available. ${troubleshootLeanExtension}`)
  const client = clientProvider.getActiveClient()
  if (!client) throw new Error(`${leanExtensionId} getActiveClient() is not available. ${troubleshootLeanExtension}`)
  const editor = ensureEditor()
  const documentUriStr = editor.document.uri.toString()
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
  const symbolsAnchored = symbols.filter(({ name }) => name.endsWith(query))
  const infosRaw = symbolsAnchored.map(({ name, location }) => {
    return ({
      name,
      uri: location.uri,
      precint: getPrecintFromUri(workspaceFolderUriStr, location.uri),
      closeness: longestCommonPrefix([documentUriStr, location.uri]).length,
    })
  })
  const infos = sortBy(
    infosRaw,
    [i => i.closeness, 'desc'],
    [i => getRankingFromPrecintType(i.precint.type), 'asc'],
    [i => i.name.startsWith(query), 'desc'],
    [i => i.uri, 'asc']
  )
  return infos.map(({ name, uri, precint }, index): StaticQuickPickItem<AutoImportQuickPickValue> => {
    return ({
      label: '$(symbol-constructor) ' + name,
      description: getWorkspaceSymbolDescription(precint),
      picked: index === 0,
      value: {
        title: name,
        uri,
        getValue: async () => toString(getLeanNamesFromWorkspaceSymbolFilePath(precint)),
      },
    })
  })
}

const getWorkspaceSymbolDescription = (precint: Precint) => precint.path

const getRankingFromPrecintType = (type: PrecintType) => {
  switch (type) {
    case 'project': return 0
    case 'package': return 1
    case 'toolchain': return 2
  }
}
