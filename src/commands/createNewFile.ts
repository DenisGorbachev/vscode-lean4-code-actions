import { ensureNonEmptyArray, isNonEmptyArray } from 'libs/utils/array/ensureNonEmptyArray'
import path from 'path'
import { concat, identity } from 'remeda'
import { FileBrand, FileBrandSchema } from 'src/models/FileBrand'
import { FileContentVariety } from 'src/models/FileContentVariety'
import { FileInfo, getFileInfo, getNewUri } from 'src/models/FileInfo'
import { leanNameSeparator, toString } from 'src/models/Lean/HieroName'
import { Name, splitNames } from 'src/models/Lean/Name'
import { NewTypeKeyword, NewTypeKeywordSchema } from 'src/models/NewTypeKeyword'
import { replaceSnippetVariables } from 'src/utils/SnippetString'
import { getRelativePathFromUri } from 'src/utils/Uri'
import { CreateNewFileConfig } from 'src/utils/WorkspaceConfiguration/CreateFileConfig'
import { createFileIfNotExists } from 'src/utils/WorkspaceEdit'
import { Line, combineFileContent, trimEmpty } from 'src/utils/text'
import { getTopLevelDirectoryEntries } from 'src/utils/workspace'
import { QuickPickItem, QuickPickItemKind, TextEditor, Uri, commands, window, workspace } from 'vscode'
import { getUntilParse } from '../../libs/utils/Getter/getUntilValid'
import { isExcluded, isHidden, leanFileExtensionLong } from '../constants'
import { getImportLinesFromStrings, getOpenLinesFromStrings } from '../models/Lean/SyntaxNodes'
import { getDeclarationSnippetLines } from '../utils/Lean/SnippetString'
import { StaticQuickPickItem } from '../utils/QuickPickItem'
import { ensureEditor, getSelectedName, getSelectedNames } from '../utils/TextEditor'
import { withImportsOpens, withImportsOpensDerivings } from '../utils/WorkspaceConfiguration/withImportsOpensDerivings'

export async function createNewFile() {
  const config = workspace.getConfiguration('lean4CodeActions.createNewFile')
  const editor = ensureEditor()
  const lib = await askLibFromEditor(editor)
  if (lib === undefined) return
  const names = await askNamesFromEditor(editor)
  if (names === undefined) return
  const [namespace, name] = splitNames(names)
  const variety = await askFileContentVarietyFromEditor(editor)
  if (variety === undefined) return
  const { brand, keyword } = variety
  const tags = brand ? [brand] : []
  const info: FileInfo = { lib, namespace, name, tags }
  const uri = getNewUri(editor.document.uri, info)
  const contents = getTypeFileContentsFromConfigV2(config)(info, keyword)
  await createFileIfNotExists(uri, contents)
  await commands.executeCommand('vscode.open', uri)
}

const withNamespacePrefix = (names: Name[]) => {
  const namespaceConfig = workspace.getConfiguration('lean4CodeActions.namespace')
  const prefix = namespaceConfig.get<string>('prefix')
  if (!prefix) return names
  return concat(prefix.split(leanNameSeparator), names)
}

export const askFilenameFromEditor = async (editor: TextEditor) => {
  const newName = getSelectedName(editor) ?? 'New'
  // TODO: validate path
  return askFilename(newName, editor.document.uri)
}

export const askNamesFromEditor = async (editor: TextEditor) => {
  // const newName = getSelectedName(editor) ?? 'New'
  return askNames(editor.document.uri)
}

export const askLibFromEditor = async (editor: TextEditor) => {
  const defaultLib = workspace.getConfiguration('lean4CodeActions').get<string>('defaultLib')
  if (defaultLib) return defaultLib
  return askLib(editor.document.uri)
}

export const askFileContentVarietyFromEditor = async (editor: TextEditor) => {
  const names = getSelectedNames(editor) ?? []
  return askFileContentVariety(names)(editor.document.uri)
}

export const askFileContentVariety = (names: Name[]) => async (currentDocumentUri: Uri) => {
  const typeBrand: FileBrand = 'type'
  const typeVarietyQuickPickItems = NewTypeKeywordSchema.options.map<StaticQuickPickItem<FileContentVariety>>(keyword => ({
    label: `${typeBrand} (${keyword})`,
    value: { brand: typeBrand, keyword },
  }))
  const brandVarietyQuickPickItems = FileBrandSchema.options.filter(brand => brand !== typeBrand).map<StaticQuickPickItem<FileContentVariety>>(brand => ({
    label: brand,
    value: { brand, keyword: null },
  }))
  const varietyQuickPickItems = concat(typeVarietyQuickPickItems, brandVarietyQuickPickItems)
  const result = await window.showQuickPick(varietyQuickPickItems, {
    title: 'Pick a file content variety',
  })
  return result && result.value
}

const getUntilValidMax = 10

export async function askNames(currentDocumentUri: Uri) {
  const info = getFileInfo(workspace.asRelativePath(currentDocumentUri))
  const { namespace, name } = info ?? { namespace: [], name: 'New' }
  const parentNamespace = toString(namespace)
  const value = parentNamespace ? parentNamespace + leanNameSeparator + name : name
  const valueSelection: [number, number] = [value.length - name.length, value.length]
  const result = await window.showInputBox({
    title: 'Fully qualified Lean name',
    value,
    valueSelection,
  })
  if (!result) return undefined
  const names = result.split(leanNameSeparator).filter(identity)
  return ensureNonEmptyArray(names)
}

// async function getImportsOpensDerivingsViaSubcommands(keyword: NewTypeKeyword, names: Name[]) {
//   const subcommand = executeSubcommandIfExists('lean4CodeActions.createNewType', keyword, names)
//   const imports = (await subcommand<Imports>('getImports')) || []
//   const opens = (await subcommand<Opens>('getOpens')) || []
//   const derivings = (await subcommand<Derivings>('getDerivings')) || []
// }

async function askKeyword() {
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

export async function askLib(currentDocumentUri: Uri) {
  const relativePath = getRelativePathFromUri(currentDocumentUri)
  const defaultLib = relativePath.split(path.sep)[1]
  const libEntries = await getTopLevelDirectoryEntries(currentDocumentUri)
  if (!libEntries) throw new Error(`Cannot get top level directory paths from uri: ${currentDocumentUri}`)
  const libs = libEntries.filter(lib => !isHidden(lib) && !isExcluded(lib) && lib !== defaultLib)
  // const currentDocumentNames = getLeanNamesFromUri(currentDocumentUri)
  // const currentDocumentParentNames = currentDocumentNames.slice(0, -1)
  // const parentNamespace = toString(currentDocumentParentNames)
  // const value = parentNamespace ? parentNamespace + leanNameSeparator + newName : newName
  // const valueSelection: [number, number] = [value.length - newName.length, value.length]
  const defaultLibItems: QuickPickItem[] = defaultLib ? [
    {
      label: defaultLib,
      kind: QuickPickItemKind.Default,
    },
    {
      label: '',
      kind: QuickPickItemKind.Separator,
    },
  ] : []
  const libItems: QuickPickItem[] = libs.map<QuickPickItem>(lib => ({
    label: lib,
    kind: QuickPickItemKind.Default,
  }))
  const items = concat(defaultLibItems, libItems)
  const result = await window.showQuickPick(items, { title: 'Pick a library' })
  return result?.label
}

export const askFilename = async (name: string, currentDocumentUri: Uri) => {
  const pathname = getRelativePathFromUri(currentDocumentUri)
  const { dir } = path.parse(pathname)
  // TODO: validate path in a loop
  const prefix = dir.substring(1) + path.sep
  const suffix = leanFileExtensionLong
  const value = prefix + name + suffix
  const valueSelection: [number, number] = [prefix.length, prefix.length + name.length]
  const validate = async (filepath: string) => {
    const { ext } = path.parse(filepath)
    if (ext !== leanFileExtensionLong) throw new Error(`Extension must be equal to ${leanFileExtensionLong}`)
    return filepath
  }
  const get = async () => {
    return window.showInputBox({
      title: 'New file path',
      value,
      valueSelection,
    })
  }
  return getUntilParse(getUntilValidMax, validate)(get)
}

export const getTypeFileContentsCV1 = (config: CreateNewFileConfig) => getTypeFileContentsV1(config.imports, config.opens, config.derivings)

export const wrapFileContentsV1 = (imports: string[], opens: string[]) => (parents: Name[], name: Name) => (contentsLines: Line[]) => {
  const importsLines = getImportLinesFromStrings(imports)
  const parentNamespaceLines = [`namespace ${toString(parents)}`]
  const opensLines = getOpenLinesFromStrings(opens)
  const childNamespaceLines = [`namespace ${name}`]
  return combineFileContent([
    importsLines,
    parentNamespaceLines,
    opensLines,
    contentsLines,
    childNamespaceLines,
  ].filter(isNonEmptyArray))
}

export const wrapFileContentsV2 = (imports: string[], opens: string[]) => (info: FileInfo, keyword: NewTypeKeyword | null) => (contentsLines: Line[]) => {
  const { lib, namespace, name, tags } = info
  const importsLines = getImportLinesFromStrings(imports)
  const opensLines = getOpenLinesFromStrings(opens)
  if (keyword) {
    const parentNamespaceLines = [`namespace ${toString(namespace)}`]
    const childNamespaceLines = [`namespace ${name}`]
    return combineFileContent([
      importsLines,
      parentNamespaceLines,
      opensLines,
      contentsLines,
      childNamespaceLines,
    ].filter(isNonEmptyArray))
  } else {
    const names = [...namespace, name]
    const namespaceLines = [`namespace ${toString(names)}`]
    return combineFileContent([
      importsLines,
      namespaceLines,
      opensLines,
      contentsLines,
    ].filter(isNonEmptyArray))
  }
}

export const getTypeFileContentsV1 = (imports: string[], opens: string[], derivings: string[]) => (keyword: NewTypeKeyword | null, parents: Name[], name: Name) => {
  const declarationSnippetLines = getDeclarationSnippetLines(derivings, keyword)
  const declarationLines = trimEmpty(replaceSnippetVariables(['$1', name, '$1'])(declarationSnippetLines))
  return wrapFileContentsV1(imports, opens)(parents, name)(declarationLines)
}

export const getTypeFileContentsV2 = (imports: string[], opens: string[], derivings: string[]) => (info: FileInfo, keyword: NewTypeKeyword | null) => {
  const { name } = info
  const declarationSnippetLines = getDeclarationSnippetLines(derivings, keyword)
  const declarationLines = trimEmpty(replaceSnippetVariables(['$1', name, '$1'])(declarationSnippetLines))
  return wrapFileContentsV2(imports, opens)(info, keyword)(declarationLines)
}

export const getTypeFileContentsFromConfigV2 = withImportsOpensDerivings(getTypeFileContentsV2)

export const wrapFileContentsFromConfigV2 = withImportsOpens(wrapFileContentsV2)
