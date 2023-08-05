import { Exports } from 'lean4/src/exports'
import { sortBy } from 'remeda'
import { QuickPickItem, extensions, window } from 'vscode'
import { WorkspaceSymbol } from 'vscode-languageserver-types'
import { ensureEditor, getImportInsertPosition, getSelectionText } from '../utils/TextEditor'
import { getLeanImportPathFromAbsoluteFilePath } from '../utils/path'
import { longestCommonPrefix } from '../utils/string'

export async function autoImport() {
  const editor = ensureEditor()
  const leanExtensionId = 'leanprover.lean4'
  const leanExtension = extensions.getExtension(leanExtensionId)
  if (!leanExtension) throw new Error(`${leanExtensionId} extension is not available`)
  const { clientProvider } = leanExtension.exports as Exports
  if (!clientProvider) throw new Error(`${leanExtensionId} extension.clientProvider is not available`)
  const client = clientProvider.getActiveClient()
  if (!client) throw new Error(`${leanExtensionId} extension.clientProvider.getActiveClient() is not available`)
  const workspaceFolder = client.getWorkspaceFolder()
  const query = getSelectionText(editor)
  if (!query) throw new Error(`Text selection is empty: please select the name for auto-import in the editor`)
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
  const currentPath = getLeanImportPathFromAbsoluteFilePath(workspaceFolder, editor.document.fileName)
  const symbolsAnchored = symbols.filter(({ name }) => name.endsWith(query))
  const infosRaw = symbolsAnchored.map(({ name, location }) => {
    const path = getLeanImportPathFromAbsoluteFilePath(workspaceFolder, location.uri)
    return ({
      name,
      path,
      closeness: longestCommonPrefix([currentPath, path]).length
    })
  })
  const infos = sortBy(infosRaw, i => -i.closeness /* most close first */)
  const items: QuickPickItem[] = infos.map((symbol, index) => ({
    label: symbol.name,
    description: symbol.path,
    picked: index === 0
  }))
  const result = await window.showQuickPick(items, {
    placeHolder: 'Pick a symbol',
    matchOnDescription: true
  })
  if (!result) return
  if (!result.description) throw new Error('Result must have a description')
  const leanImportPath = result.description
  const insertPosition = getImportInsertPosition(editor)
  editor.edit(editBuilder => {
    editBuilder.insert(insertPosition, `import ${leanImportPath}\n`)
  })
}
