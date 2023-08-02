// Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';
import * as path from 'path';
import { identity, last, sort } from 'remeda';
import { kebabCase } from 'lodash'
import { nail } from './utils/string';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { todo } from './utils/todo';
import { CompletionItem, CompletionItemKind, CompletionItemLabel, ExtensionContext, Position, TextDocument, TextEditor, Uri, commands, env, languages, window, workspace } from 'vscode';
import { autoImport } from './commands/autoImport';
import { Line, Segment, join, glue, joinAllSegments } from './utils/text';
import { getNamespaces, toNamespace, getNamespacesSegments } from './utils/lean';
import { insertNamespaces } from './commands/insertNamespaces';
import { moveDefinitionToNewFile } from './commands/moveDefinitionToNewFile';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	const getFreewriteFileContent = (namespace: string) => {
		return nail(`
			import Playbook.Std
			import Playbook.Generic
			
			open Playbook Std Generic
			
			namespace Freewrite
			
			namespace ${namespace}
			
			def thoughts : Thoughts := []

			def wishes : Thoughts := []
		`)
	}

	const getFreewriteNamespace = (now: Date) => 'on_' + now.toISOString().slice(0, 10).replace(/-/g, '_')


	let insertNamespacesCommand = commands.registerCommand('vscode-lean4-extra.insertNamespaces', insertNamespaces);

	let createFreewriteFileCommand = commands.registerCommand('vscode-lean4-extra.createFreewriteFile', async () => {
		const { workspaceFolders } = workspace
		if (!workspaceFolders) {
			window.showErrorMessage('No workspace folders found');
			return;
		}

		const workspaceFolder = workspaceFolders[0];
		if (!workspaceFolder) {
			window.showErrorMessage('No workspace folder found');
			return;
		}

		const root = workspaceFolder.uri.fsPath;
		const now = new Date()

		const ns = getFreewriteNamespace(now)
		const filename = `${root}/Freewrite/${ns}.lean`
		if (!existsSync(filename)) {
			const content = getFreewriteFileContent(ns)
			await writeFile(filename, content)
		}
		await commands.executeCommand('vscode.open', Uri.file(filename));
	});

	let textToListCommand = commands.registerCommand('vscode-lean4-extra.textToList', async () => {
		const editor = window.activeTextEditor;
		if (!editor) {
			window.showErrorMessage('No active text editor');
			return;
		}

		const selection = editor.selection;
		const text = editor.document.getText(selection);
		const lines = text.split('\n').map(line => line.trim()).filter(line => line.length);
		const linesRendered = lines.map(line => `"${line}"`).join(",\n")

		editor.edit(editBuilder => {
			editBuilder.replace(selection, linesRendered);
		});
	});

	let autoImportCommand = commands.registerCommand('vscode-lean4-extra.autoImport', autoImport);

	let moveDefinitionToNewFileCommand = commands.registerCommand('vscode-lean4-extra.moveDefinitionToNewFile', moveDefinitionToNewFile);

	// const getInductiveSegments = (name: string | undefined) => {

	// 	return `import ${namespaces.join('.')}`
	// }

	const getImportShorthand = (currentFilePath: string) => {
		const namespaces = getNamespaces(currentFilePath)
		if (!namespaces) return;
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
				window.showErrorMessage(e.toString());
				// window.showErrorMessage('The clipboard does not contain a valid filesystem path');
			} else {
				window.showErrorMessage('Unknown error occurred');
			}
			return;
		}
	}

	const getVariableShorthand = (currentFilePath: string) => {
		const namespaces = getNamespaces(currentFilePath)
		if (!namespaces) return;
		const typeName = namespaces.pop()
		if (!typeName) {
			window.showErrorMessage('Could not find a type name');
			return;
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
	};

	const getOneLetterNameFromType = (typeName: string) => {
		return typeName.charAt(0).toLowerCase()
	}

	const getCommonOpenNamespaces = () => ['Playbook', 'Std', 'Generic']

	const getOpenCommand = () => `open ${getCommonOpenNamespaces().join(' ')}`;

	const getGenericImports = () => {
		return [
			[
				"import Playbook.Std",
				"import Playbook.Generic",
			],
			[
				getOpenCommand(),
			]
		];
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
				ns.insertText = joinAllSegments([getNamespacesSegments(document.fileName)])
				const nsgen = new CompletionItem('nsgen')
				nsgen.insertText = joinAllSegments([getGenericImports(), getNamespacesSegments(document.fileName)])
				const imp = new CompletionItem('imp')
				imp.insertText = getImportShorthand(document.fileName)
				const cimp = new CompletionItem('cimp')
				cimp.insertText = await getClipboardImportShorthand()
				const variable = getCompletionItem('var')({
					insertText: getVariableShorthand(document.fileName)
				})
				const open = getCompletionItemITS('open', getOpenCommand())
				return [
					gen,
					ns,
					nsgen,
					imp,
					cimp,
					variable,
					open
					// getCompletionItem('ind')({
					// 	insertText: joinAllSegments([getInductiveSegments()])
					// })
				];
			},
		},
	);

	context.subscriptions.push(insertNamespacesCommand);
	context.subscriptions.push(createFreewriteFileCommand);
	context.subscriptions.push(textToListCommand);
	context.subscriptions.push(autoImportCommand);
	context.subscriptions.push(moveDefinitionToNewFileCommand);
	context.subscriptions.push(completions);
}

// This method is called when your extension is deactivated
export function deactivate() { }
