// Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';
import * as path from 'path'
import { identity, last } from 'remeda'
import { kebabCase } from 'voca'
import { CompletionItem, CompletionItemKind, CompletionItemLabel, ExtensionContext, Position, TextDocument, Uri, commands, env, languages, window, workspace } from 'vscode'
import { autoImport } from './commands/autoImport'
import { convertTextToList } from './commands/convertTextToList'
import { createFreewriteFile } from './commands/createFreewriteFile'
import { createNewTypeFile } from './commands/createNewTypeFile'
import { extractDefinitionToSeparateFile } from './commands/extractDefinitionToSeparateFile'
import { provideRenameEdits } from './commands/renameLocalVariable'
import { getNames, getNamespacesSegments } from './utils/Lean'
import { joinAllSegments } from './utils/text'

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration('lean4CodeActions')

  const createFreewriteFileCommand = commands.registerCommand('lean4CodeActions.createFreewriteFile', createFreewriteFile)

  const convertTextToListCommand = commands.registerCommand('lean4CodeActions.convertTextToList', convertTextToList)

  const autoImportCommand = commands.registerCommand('lean4CodeActions.autoImport', autoImport)

  const extractDefinitionToSeparateFileCommand = commands.registerCommand('lean4CodeActions.extractDefinitionToSeparateFile', extractDefinitionToSeparateFile)

  const createNewTypeFileCommand = commands.registerCommand('lean4CodeActions.createNewTypeFile', createNewTypeFile)

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

  const getVariableShorthand = (uri: Uri) => {
    const namespaces = getNames(uri)
    if (!namespaces) { return }
    const typeName = namespaces.pop()
    if (!typeName) {
      window.showErrorMessage('Could not find a type name')
      return
    }
    const varName = getShortNameFromType(typeName)
    return `variable (${varName} : ${typeName})`
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

  const getCommonOpenNamespaces = () => ['Playbook', 'Std', 'Generic']

  const getOpenCommand = () => `open ${getCommonOpenNamespaces().join(' ')}`

  const getGenericImports = () => {
    return [
      [
        'import Playbook.Std',
        'import Playbook.Generic',
      ],
      [
        getOpenCommand(),
      ],
    ]
  }

  const getCompletionItem = (label: string | CompletionItemLabel, kind?: CompletionItemKind) => (props: Partial<CompletionItem>) => {
    const item = new CompletionItem(label, kind)
    return Object.assign(item, props)
  }

  const getCompletionItemInsertText = (label: string | CompletionItemLabel, kind?: CompletionItemKind) => (insertText: string) => getCompletionItem(label, kind)({ insertText })

  const getCompletionItemInsertTextSimple = (label: string | CompletionItemLabel, insertText: string) => getCompletionItem(label)({ insertText })
  const getCompletionItemITS = getCompletionItemInsertTextSimple

  const completions = languages.registerCompletionItemProvider(
    {
      scheme: 'file',
    },
    {
      async provideCompletionItems(document: TextDocument, position: Position) {
        const gen = new CompletionItem('gen')
        gen.insertText = joinAllSegments([getGenericImports()])
        const ns = new CompletionItem('ns')
        ns.insertText = joinAllSegments([getNamespacesSegments(document.uri)])
        const nsgen = new CompletionItem('nsgen')
        nsgen.insertText = joinAllSegments([getGenericImports(), getNamespacesSegments(document.uri)])
        const imp = new CompletionItem('imp')
        imp.insertText = getImportShorthand(document.uri)
        const cimp = new CompletionItem('cimp')
        cimp.insertText = await getClipboardImportShorthand()
        const variable = getCompletionItem('var')({
          insertText: getVariableShorthand(document.uri),
        })
        const open = getCompletionItemITS('open', getOpenCommand())
        return [
          gen,
          ns,
          nsgen,
          imp,
          cimp,
          variable,
          open,
          // getCompletionItem('ind')({
          // 	insertText: joinAllSegments([getInductiveSegments()])
          // })
        ]
      },
    },
  )

  context.subscriptions.push(createFreewriteFileCommand)
  context.subscriptions.push(convertTextToListCommand)
  context.subscriptions.push(autoImportCommand)
  context.subscriptions.push(extractDefinitionToSeparateFileCommand)
  context.subscriptions.push(createNewTypeFileCommand)
  context.subscriptions.push(completions)
  if (config.get('registerRenameProvider')) {
    languages.registerRenameProvider({ language: 'lean4' }, { provideRenameEdits })
  }
}

// This method is called when your extension is deactivated
export function deactivate() { }
