import { sortBy } from 'remeda'
import { HieroName } from 'src/models/HieroName'
import { Name } from 'src/models/Lean/Name'
import { NewTypeKeyword, NewTypeKeywordSchema } from 'src/models/NewTypeKeyword'
import { toNamespace } from 'src/utils/Lean'
import { LeanExports } from 'src/utils/LeanExtension'
import { combineAll } from 'src/utils/text'
import { ensureWorkspaceFolder } from 'src/utils/workspace'
import { extensions, window } from 'vscode'
import { WorkspaceSymbol } from 'vscode-languageserver-types'
import { GenericQuickPickItem, StaticQuickPickItem } from '../utils/QuickPickItem'
import { ensureEditor } from '../utils/TextEditor'
import { getLeanNamesFromMaybeLakeRelativeFilePath, getRelativeFilePathFromAbsoluteFilePath } from '../utils/path'
import { longestCommonPrefix } from '../utils/string'

export async function createNewType() {
  const editor = ensureEditor()
  const keyword = await getKeyword()
  // const names = await getNames()
  // editor.edit(editBuilder => {
  //   editBuilder.insert(insertPosition, `import ${leanImportPath}\n`)
  // })
}

export function getTypeFileContent(imports: HieroName[], opens: HieroName[][], derivings: HieroName[], keyword: NewTypeKeyword, parents: Name[], name: Name) {
  const importsLines = imports.map(hieroname => `import ${toNamespace(hieroname)}`)
  const openLines = opens.map(hieronames => `open ${hieronames.map(toNamespace).join(' ')}`)
  const parentNamespaceLines = [`namespace ${toNamespace(parents)}`]
  const typeLines = getTypeLines(derivings, keyword, name)
  const childNamespaceLines = [`namespace ${name}`]
  return combineAll([
    importsLines,
    openLines,
    parentNamespaceLines,
    typeLines,
    childNamespaceLines
  ])
}

async function getKeyword() {
  const keywordQuickPickItems = NewTypeKeywordSchema.options.map<StaticQuickPickItem<NewTypeKeyword>>(keyword => ({
    label: keyword,
    value: keyword,
    picked: keyword === 'structure'
  }))
  const keywordResult = await window.showQuickPick(keywordQuickPickItems, {
    title: 'Type keyword'
  })
  return keywordResult && keywordResult.value
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

function getTypeLines(derivings: HieroName[], keyword: NewTypeKeyword, name: Name) {
  switch (keyword) {
    case 'structure':
    case 'inductive':
      return [
        `${keyword} ${name} where`,
        ``,
        `deriving ${derivings.map(toNamespace).join(', ')}`
      ]
    case 'abbrev':
      return [
        `${keyword} ${name} := sorry`,
        ``,
        `deriving instance ${derivings.map(toNamespace).join(', ')} for ${name}`
      ]
  }
}
