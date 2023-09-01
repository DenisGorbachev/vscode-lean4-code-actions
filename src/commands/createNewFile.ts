import { ensureNonEmptyArray, isNonEmptyArray } from 'libs/utils/array/ensureNonEmptyArray'
import { identity, last } from 'remeda'
import { leanNameSeparator, toString } from 'src/models/Lean/HieroName'
import { Name } from 'src/models/Lean/Name'
import { NewTypeKeyword, NewTypeKeywordSchema } from 'src/models/NewTypeKeyword'
import { replaceSnippetVariables } from 'src/utils/SnippetString'
import { createFileIfNotExists } from 'src/utils/WorkspaceEdit'
import { getLeanNamesFromUri, getUriFromLeanNames } from 'src/utils/WorkspaceFolder'
import { combineFileContent, trimEmpty } from 'src/utils/text'
import { ensureWorkspaceFolder } from 'src/utils/workspace'
import { Uri, commands, window, workspace } from 'vscode'
import { getImportLinesFromStrings, getOpenLinesFromStrings } from '../models/Lean/SyntaxNodes'
import { getDeclarationSnippetLines } from '../utils/Lean/SnippetString'
import { StaticQuickPickItem } from '../utils/QuickPickItem'
import { ensureEditor, getSelectionText } from '../utils/TextEditor'

export async function createNewFile() {
  const config = workspace.getConfiguration('lean4CodeActions.createNewFile')
  const editor = ensureEditor()
  const workspaceFolder = ensureWorkspaceFolder(editor.document.uri)
  const newName = getSelectionText(editor) ?? 'New'
  const keyword = await getKeyword()
  if (keyword === undefined) return
  const names = await getNames(newName, editor.document.uri)
  if (names === undefined) return
  const name = last(names)
  const parents = names.slice(0, -1)
  const imports = config.get<string[]>('imports', [])
  const opens = config.get<string[]>('opens', [])
  const derivings = config.get<string[]>('derivings', [])
  const uri = getUriFromLeanNames(workspaceFolder, names)
  const contents = getTypeFileContents(imports, opens, derivings, keyword, parents, name)
  await createFileIfNotExists(uri, contents)
  await commands.executeCommand('vscode.open', uri)
}

// async function getImportsOpensDerivingsViaSubcommands(keyword: NewTypeKeyword, names: Name[]) {
//   const subcommand = executeSubcommandIfExists('lean4CodeActions.createNewType', keyword, names)
//   const imports = (await subcommand<Imports>('getImports')) || []
//   const opens = (await subcommand<Opens>('getOpens')) || []
//   const derivings = (await subcommand<Derivings>('getDerivings')) || []
// }

async function getKeyword() {
  const keywordQuickPickItems = NewTypeKeywordSchema.options.map<StaticQuickPickItem<NewTypeKeyword | null>>(keyword => ({
    label: keyword,
    value: keyword,
    picked: keyword === 'structure',
  })).concat({
    label: '(none)',
    value: null,
  })
  const keywordResult = await window.showQuickPick(keywordQuickPickItems, {
    title: 'Pick a keyword for the definition',
  })
  return keywordResult && keywordResult.value
}

async function getNames(newName: string, currentDocumentUri: Uri) {
  const currentDocumentNames = getLeanNamesFromUri(currentDocumentUri)
  // const currentDocumentParentNames = currentDocumentNames.slice(0, -1)
  const parentNamespace = toString(currentDocumentNames)
  const value = parentNamespace ? parentNamespace + leanNameSeparator + newName : newName
  const valueSelection: [number, number] = [value.length - newName.length, value.length]
  const result = await window.showInputBox({
    title: 'Fully qualified Lean name for new type',
    value,
    valueSelection,
  })
  if (!result) return undefined
  const names = result.split(leanNameSeparator).filter(identity)
  return ensureNonEmptyArray(names)
}

export function getTypeFileContents(imports: string[], opens: string[], derivings: string[], keyword: NewTypeKeyword | null, parents: Name[], name: Name) {
  const importsLines = getImportLinesFromStrings(imports)
  const opensLines = getOpenLinesFromStrings(opens)
  const parentNamespaceLines = [`namespace ${toString(parents)}`]
  const declarationSnippetLines = getDeclarationSnippetLines(derivings, keyword)
  const declarationLines = trimEmpty(replaceSnippetVariables(['$1', name, '$1'])(declarationSnippetLines))
  const childNamespaceLines = [`namespace ${name}`]
  return combineFileContent([
    importsLines,
    opensLines,
    parentNamespaceLines,
    declarationLines,
    childNamespaceLines,
  ].filter(isNonEmptyArray))
}
