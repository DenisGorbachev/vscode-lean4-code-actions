// Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';
import * as path from 'path'
import { identity, isDefined, last } from 'remeda'
import { kebabCase } from 'voca'
import { CompletionItem, CompletionItemKind, CompletionItemLabel, ExtensionContext, Position, SnippetString, TextDocument, Uri, commands, env, languages, window, workspace } from 'vscode'
import { autoImport } from './commands/autoImport'
import { convertTextToList } from './commands/convertTextToList'
import { createFreewriteFile } from './commands/createFreewriteFile'
import { createNewFile } from './commands/createNewFile'
import { createNewFileSet } from './commands/createNewFileSet'
import { extractDefinitionToSeparateFile } from './commands/extractDefinitionToSeparateFile'
import { renameDeclaration as renameDefinition } from './commands/renameDefinition'
import { setArgumentStyle } from './commands/setArgumentStyle'
import { onDidRenameFiles } from './listeners/onDidRenameFiles'
import { getFileInfoFromUri } from './models/FileInfo'
import { getImportLinesFromStrings, getOpenLinesFromStrings } from './models/Lean/SyntaxNodes'
import { provideRenameEdits } from './providers/providerRenameEdits'
import { getNames, getNamespaceLinesFromFileName, getNamespaceLinesFromFilePath } from './utils/Lean'
import { getDeclarationSnippetLines, getSnippetStringFromSnippetLines } from './utils/Lean/SnippetString'

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration('lean4CodeActions')

  const createFreewriteFileCommand = commands.registerCommand('lean4CodeActions.createFreewriteFile', createFreewriteFile)

  const convertTextToListCommand = commands.registerCommand('lean4CodeActions.convertTextToList', convertTextToList)

  const autoImportCommand = commands.registerCommand('lean4CodeActions.autoImport', autoImport)

  const extractDefinitionToSeparateFileCommand = commands.registerCommand('lean4CodeActions.extractDefinitionToSeparateFile', extractDefinitionToSeparateFile)

  const createNewFileCommand = commands.registerCommand('lean4CodeActions.createNewFile', createNewFile)

  const createNewFileSetCommand = commands.registerCommand('lean4CodeActions.createNewFileSet', createNewFileSet)

  const setArgumentStyleCommand = commands.registerCommand('lean4CodeActions.setArgumentStyle', setArgumentStyle)

  const renameDeclarationCommand = commands.registerCommand('lean4CodeActions.renameDefinition', renameDefinition)

  // const renameLocalVariableCommand = commands.registerCommand('lean4CodeActions.renameLocalVariable', renameLocalVariable)

  // const getInductiveSegments = (name: string | undefined) => {

  // 	return `import ${namespaces.join('.')}`
  // }

  const getImportShorthand = (uri: Uri) => {
    const namespaces = getNames(uri)
    if (!namespaces) { return }
    return `import ${namespaces.join('.')}`
  }

  const getLeanNamesFromParsedPath = (parsedPath: path.ParsedPath) => {
    const names = parsedPath.dir.split(path.sep)
    names.push(parsedPath.name)
    return names.filter(identity)
  }

  const getLeanPathFromLeanNames = (names: string[]) => {
    return names.join('.')
  }

  const getClipboardImportShorthand = async () => {
    const text = await env.clipboard.readText()
    try {
      const result = path.parse(text)
      const leanPath = getLeanNamesFromParsedPath(result)
      return `import ${getLeanPathFromLeanNames(leanPath)}`
    } catch (e) {
      if (e instanceof Error) {
        window.showErrorMessage(e.toString())
        // window.showErrorMessage('The clipboard does not contain a valid filesystem path');
      } else {
        window.showErrorMessage('Unknown error occurred')
      }
      return
    }
  }

  const getVariableLines = (uri: Uri) => {
    const info = getFileInfoFromUri(uri)
    if (!info) return
    const { name: typeName } = info
    const varName = typeName && getShortNameFromType(typeName)
    return [`variable (\${1:${varName}} : \${2:${typeName}})`]
  }

  const getShortNameFromType = (typeName: string) => {
    const typeNameNoVersion = typeName.replace(/V\d+$/, '')
    return last(kebabCase(typeNameNoVersion).split('-'))
  }

  // const getShortNameFromTypeSpec = ($words: [string, ...string[]]) => {
  //   const words = $words.map(w => w.toLowerCase())
  //   const input = words.map(w => w.toUpperCase()).join('')
  //   const output = words[words.length - 1].toLowerCase()
  // }

  const toUpperCaseFirstLetter = (input: string) => {
    if (input.length === 0) {
      return input
    }
    const firstLetter = input.charAt(0).toUpperCase()
    const restOfWord = input.slice(1)
    return firstLetter + restOfWord
  }

  const getOneLetterNameFromType = (typeName: string) => {
    return typeName.charAt(0).toLowerCase()
  }

  const getCompletionItem = (label: string | CompletionItemLabel, kind?: CompletionItemKind) => (props: Partial<CompletionItem>) => {
    const item = new CompletionItem(label, kind)
    return Object.assign(item, props)
  }

  const getCompletionItemInsertText = (label: string | CompletionItemLabel, kind?: CompletionItemKind) => (insertText: string | SnippetString) => getCompletionItem(label, kind)({ insertText })

  const getCompletionItemInsertTextSimple = (label: string | CompletionItemLabel, insertText: string) => getCompletionItem(label)({ insertText })

  const getCompletionItemInsertTextSnippet = (label: string | CompletionItemLabel, insertText: SnippetString) => getCompletionItem(label, CompletionItemKind.Snippet)({ insertText })

  const getCompletionItemInsertTextSnippetLines = (label: string | CompletionItemLabel, lines: string[]) => getCompletionItem(label, CompletionItemKind.Snippet)({ insertText: getSnippetStringFromSnippetLines(lines) })

  const getCompletionItemInsertTextSnippetLinesChecked = (label: string | CompletionItemLabel, lines: string[] | undefined) => lines ? getCompletionItemInsertTextSnippetLines(label, lines) : undefined

  const getCompletionItemITS = getCompletionItemInsertTextSimple

  const getCompletionItemITN = getCompletionItemInsertTextSnippet

  const getCompletionItemITSL = getCompletionItemInsertTextSnippetLines

  const getCompletionItemITSLC = getCompletionItemInsertTextSnippetLinesChecked

  const completions = languages.registerCompletionItemProvider(
    {
      scheme: 'file',
    },
    {
      async provideCompletionItems(document: TextDocument, position: Position) {
        // need to get fresh config values here because they might have been changed by the user after the extension was activated
        const config = workspace.getConfiguration('lean4CodeActions')
        const derivings = config.get<string[]>('createNewFile.derivings', [])
        const imports = config.get<string[]>('createNewFile.imports', [])
        const opens = config.get<string[]>('createNewFile.opens', [])
        const importLines = getImportLinesFromStrings(imports)
        const openLines = getOpenLinesFromStrings(opens)
        return [
          (getCompletionItemITSLC('imp', importLines)),
          (getCompletionItemITSLC('op', openLines)),
          (getCompletionItemITSLC('ns', getNamespaceLinesFromFileName(document.uri))),
          (getCompletionItemITSLC('nsp', getNamespaceLinesFromFilePath(document.uri))),
          (getCompletionItemITSLC('var', getVariableLines(document.uri))),
          (getCompletionItemITSLC('struct', getDeclarationSnippetLines(derivings, 'structure'))),
          (getCompletionItemITSLC('ind', getDeclarationSnippetLines(derivings, 'inductive'))),
          (getCompletionItemITSLC('cls', getDeclarationSnippetLines(derivings, 'class'))),
        ].filter(isDefined)
      },
    },
  )

  context.subscriptions.push(createFreewriteFileCommand)
  context.subscriptions.push(convertTextToListCommand)
  context.subscriptions.push(autoImportCommand)
  context.subscriptions.push(extractDefinitionToSeparateFileCommand)
  context.subscriptions.push(createNewFileCommand)
  context.subscriptions.push(createNewFileSetCommand)
  context.subscriptions.push(setArgumentStyleCommand)
  context.subscriptions.push(renameDeclarationCommand)
  context.subscriptions.push(completions)
  if (config.get('registerRenameProvider')) {
    languages.registerRenameProvider({ language: 'lean4' }, { provideRenameEdits })
  }
  if (config.get('updateImportsOnFileRename')) {
    workspace.onDidRenameFiles(onDidRenameFiles)
  }
}

// This method is called when your extension is deactivated
export function deactivate() { }

interface Snippet {
  label: string | CompletionItemLabel
  lines: string[] | undefined
}
