import { ensureNonEmptyArray } from 'libs/utils/array/ensureNonEmptyArray'
import { trim } from 'libs/utils/array/trim'
import { identity, last } from 'remeda'
import { Name } from 'src/models/Lean/Name'
import { Imports, Opens } from 'src/models/Lean/SyntaxNodes'
import { NewTypeKeyword, NewTypeKeywordSchema } from 'src/models/NewTypeKeyword'
import { leanNameSeparator, toNamespace } from 'src/utils/Lean'
import { createFileIfNotExists } from 'src/utils/WorkspaceEdit'
import { getLeanNamesFromUri, getUriFromLeanNames } from 'src/utils/WorkspaceFolder'
import { combineAll } from 'src/utils/text'
import { ensureWorkspaceFolder } from 'src/utils/workspace'
import { isEmpty } from 'voca'
import { Uri, commands, window, workspace } from 'vscode'
import { StaticQuickPickItem } from '../utils/QuickPickItem'
import { ensureEditor } from '../utils/TextEditor'

export async function createNewTypeFile() {
  const config = workspace.getConfiguration('lean4CodeActions.createNewTypeFile')
  const editor = ensureEditor()
  const workspaceFolder = ensureWorkspaceFolder(editor.document.uri)
  const keyword = await getKeyword()
  if (!keyword) return
  const names = await getNames(editor.document.uri)
  if (!names) return
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

// async function getImportsOpensDerivingsOld(keyword: NewTypeKeyword, names: Name[]) {
//   const subcommand = executeSubcommandIfExists('lean4CodeActions.createNewType', keyword, names)
//   const imports = (await subcommand<Imports>('getImports')) || []
//   const opens = (await subcommand<Opens>('getOpens')) || []
//   const derivings = (await subcommand<Derivings>('getDerivings')) || []
// }

async function getKeyword() {
  const keywordQuickPickItems = NewTypeKeywordSchema.options.map<StaticQuickPickItem<NewTypeKeyword>>(keyword => ({
    label: keyword,
    value: keyword,
    picked: keyword === 'structure',
  }))
  const keywordResult = await window.showQuickPick(keywordQuickPickItems, {
    title: 'Type keyword',
  })
  return keywordResult && keywordResult.value
}

async function getNames(currentDocumentUri: Uri) {
  const currentDocumentNames = getLeanNamesFromUri(currentDocumentUri)
  const namespace = toNamespace(currentDocumentNames)
  const defaultName = 'NewType'
  const value = namespace + leanNameSeparator + defaultName
  const valueSelection: [number, number] = [namespace.length + 1, value.length]
  const result = await window.showInputBox({
    title: 'Fully qualified Lean name for new type',
    value,
    valueSelection,
  })
  if (!result) return undefined
  const names = result.split(leanNameSeparator).filter(identity)
  return ensureNonEmptyArray(names)
}

export function getTypeFileContents(imports: string[], opens: string[], derivings: string[], keyword: NewTypeKeyword, parents: Name[], name: Name) {
  const importsLines = imports.map(name => `import ${name}`)
  const opensLines = opens.length ? [`open ${opens.join(' ')}`] : []
  const parentNamespaceLines = [`namespace ${toNamespace(parents)}`]
  const typeLines = getTypeLines(derivings, keyword, name)
  const childNamespaceLines = [`namespace ${name}`]
  const linesArray = [
    importsLines,
    opensLines,
    parentNamespaceLines,
    typeLines,
    childNamespaceLines,
  ].map(trim<string>(isEmpty))
  return combineAll(linesArray).trim()
}

function getOpenLines(opens: Opens) {
  return opens.map(hieronames => `open ${hieronames.map(toNamespace).join(' ')}`)
}

function getImportLines(imports: Imports) {
  return imports.map(hieroname => `import ${toNamespace(hieroname)}`)
}

function getTypeLines(derivings: string[], keyword: NewTypeKeyword, name: Name) {
  switch (keyword) {
    case 'structure':
    case 'inductive':
    case 'class':
      return [
        `${keyword} ${name} where`,
        '',
        derivings.length ? `deriving ${derivings.join(', ')}` : '',
      ]
    case 'abbrev':
      return [
        `${keyword} ${name} := sorry`,
        '',
        derivings.length ? `deriving instance ${derivings.join(', ')} for ${name}` : '',
      ]
  }
}

const executeCommandsIfExist = async <T = unknown>(commands: string[], ...args: unknown[]): Promise<Array<T | undefined>> => {
  const promises = commands.map(command => executeCommandIfExists<T>(command, ...args))
  return Promise.all(promises)
}

const executeCommandIfExists = async <T = unknown>(command: string, ...args: unknown[]): Promise<T | undefined> => {
  const commandNames = await commands.getCommands()
  return commandNames.includes(command) ? commands.executeCommand(command) : undefined
}

const executeSubcommandIfExists = (commandPrefix: string, ...args: unknown[]) => async <T = unknown>(subcommand: string): Promise<T | undefined> => {
  return executeCommandIfExists<T>(commandPrefix + '.' + subcommand, ...args)
}

