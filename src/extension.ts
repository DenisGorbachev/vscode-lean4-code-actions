// Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';
import * as path from 'path'
import { identity, last } from 'remeda'
import { kebabCase } from 'voca'
import { CompletionItem, CompletionItemKind, CompletionItemLabel, ExtensionContext, Position, SnippetString, TextDocument, Uri, commands, env, languages, window, workspace } from 'vscode'
import { autoImport } from './commands/autoImport'
import { convertTextToList } from './commands/convertTextToList'
import { createFreewriteFile } from './commands/createFreewriteFile'
import { createNewFile } from './commands/createNewFile'
import { extractDefinitionToSeparateFile } from './commands/extractDefinitionToSeparateFile'
import { provideRenameEdits } from './commands/renameLocalVariable'
import { getImportLinesFromStrings, getOpenLinesFromStrings } from './models/Lean/SyntaxNodes'
import { getNames, getNamespaceLines } from './utils/Lean'
import { getDeclarationSnippetLines, getSnippetStringFromSnippetLines } from './utils/Lean/SnippetString'

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration('lean4CodeActions')
  const derivings = config.get<string[]>('createNewFile.derivings', [])
  const imports = config.get<string[]>('createNewFile.imports', [])
  const opens = config.get<string[]>('createNewFile.opens', [])

  const createFreewriteFileCommand = commands.registerCommand('lean4CodeActions.createFreewriteFile', createFreewriteFile)

  const convertTextToListCommand = commands.registerCommand('lean4CodeActions.convertTextToList', convertTextToList)

  const autoImportCommand = commands.registerCommand('lean4CodeActions.autoImport', autoImport)

  const extractDefinitionToSeparateFileCommand = commands.registerCommand('lean4CodeActions.extractDefinitionToSeparateFile', extractDefinitionToSeparateFile)

  const createNewFileCommand = commands.registerCommand('lean4CodeActions.createNewFile', createNewFile)

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
    const namespaces = getNames(uri)
    const typeName = namespaces.pop()
    const varName = typeName && getShortNameFromType(typeName)
    return [`variable (\${1:${varName}} : \${2:${typeName}})`]
  }

  const getShortNameFromType = (typeName: string) => {
    return last(kebabCase(typeName).split('-'))
  }

  const getShortNameFromTypeSpec = ($words: [string, ...string[]]) => {
    const words = $words.map(w => w.toLowerCase())
    const input = words.map(w => w.toUpperCase()).join('')
    const output = words[words.length - 1].toLowerCase()
  }

  const toUpperCaseFirstLetter = (input: string) => {
    if (input.length === 0) {
      return input
    } else {
      const firstLetter = input.charAt(0).toUpperCase()
      const restOfWord = input.slice(1)
      return firstLetter + restOfWord
    }
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

  const getCompletionItemITS = getCompletionItemInsertTextSimple

  const getCompletionItemITN = getCompletionItemInsertTextSnippet

  const getCompletionItemITSL = getCompletionItemInsertTextSnippetLines

  const completions = languages.registerCompletionItemProvider(
    {
      scheme: 'file',
    },
    {
      async provideCompletionItems(document: TextDocument, position: Position) {
        const importLines = getImportLinesFromStrings(imports)
        const openLines = getOpenLinesFromStrings(opens)
        const imp = getCompletionItemITSL('imp', importLines)
        const op = getCompletionItemITSL('op', openLines)
        const ns = getCompletionItemITSL('ns', getNamespaceLines(document.uri))
        // const cimp = new CompletionItem('cimp')
        // cimp.insertText = await getClipboardImportShorthand()
        const variable = getCompletionItemITSL('var', getVariableLines(document.uri))
        const struct = getCompletionItemITSL('struct', getDeclarationSnippetLines(derivings, 'structure'))
        const ind = getCompletionItemITSL('ind', getDeclarationSnippetLines(derivings, 'inductive'))
        const cls = getCompletionItemITSL('cls', getDeclarationSnippetLines(derivings, 'class'))
        return [
          imp,
          op,
          ns,
          variable,
          struct,
          ind,
          cls,
        ]
      },
    },
  )

  context.subscriptions.push(createFreewriteFileCommand)
  context.subscriptions.push(convertTextToListCommand)
  context.subscriptions.push(autoImportCommand)
  context.subscriptions.push(extractDefinitionToSeparateFileCommand)
  context.subscriptions.push(createNewFileCommand)
  context.subscriptions.push(completions)
  if (config.get('registerRenameProvider')) {
    languages.registerRenameProvider({ language: 'lean4' }, { provideRenameEdits })
  }
}

// This method is called when your extension is deactivated
export function deactivate() { }
