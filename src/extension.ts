// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';
import * as path from 'path';
import { identity, last } from 'remeda';
import { kebabCase } from 'lodash'
import { nail } from './utils/string';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { Exports } from 'lean4/src/exports'
import { WorkspaceSymbol } from 'vscode-languageserver-types'
import { todo } from './utils/todo';
import { CompletionItem, CompletionItemKind, CompletionItemLabel, ExtensionContext, Position, QuickPickItem, TextDocument, TextEditor, Uri, commands, env, extensions, languages, window, workspace } from 'vscode';
import { sep } from 'path';

function stripExtension(filename: string) {
	const parsed = path.parse(filename);
	return path.join(parsed.dir, parsed.name);
}

type Line = string
type Segment = Line[]

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-lean4-extra" is now active!');

	const getSelectionText = (editor: TextEditor) => {
		// const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active)
		// return editor.document.getText(wordRange)
		return editor.document.getText(editor.selection)
	}

	const getImportFilename = async () => {
		const editor = window.activeTextEditor
		if (!editor) {
			window.showErrorMessage('No active editor found');
			return;
		}
		// console.log('>>> getImportFilename')
		const leanExtensionId = 'leanprover.lean4';
		const leanExtension = extensions.getExtension(leanExtensionId);
		if (!leanExtension) {
			window.showErrorMessage(`${leanExtensionId} extension is not available`);
			return;
		}
		const { clientProvider } = leanExtension.exports as Exports
		if (!clientProvider) {
			window.showErrorMessage(`${leanExtensionId} extension.clientProvider is not available`);
			return;
		}
		const client = clientProvider.getActiveClient()
		if (!client) {
			window.showErrorMessage(`${leanExtensionId} extension.clientProvider.getActiveClient() is not available`);
			return;
		}
		const workspaceFolder = client.getWorkspaceFolder()
		const query = getSelectionText(editor)
		if (!query) {
			window.showWarningMessage(`Text selection is empty: please select the name for auto-import in the editor`);
			return;
		}
		const response: WorkspaceSymbol[] | null = await client.sendRequest('workspace/symbol', {
			query
		}).catch((e) => {
			if (e instanceof Error) {
				window.showErrorMessage(e.toString());
				return;
			} else {
				window.showErrorMessage(`Unknown error occurred while sending a request to LSP: ${e}`);
				return;
			}
		})
		if (!response) {
			window.showErrorMessage(`Received a null response from LSP`);
			return;
		}
		const items: QuickPickItem[] = response.map((symbol, index) => ({
			label: symbol.name,
			description: getLeanImportPathFromAbsoluteFilePath(workspaceFolder, symbol.location.uri),
			picked: index === 0
		}))
		const result = await window.showQuickPick(items, {
			title: 'Auto-import symbol',
			placeHolder: 'Pick a symbol',
			matchOnDescription: true
		})
		if (!result) return;
		if (!result.description) throw new Error('Result must have a description')
		const leanImportPath = result.description
		const insertPosition = getImportInsertPosition(editor)
		editor.edit(editBuilder => {
			editBuilder.insert(insertPosition, `import ${leanImportPath}\n`);
		});
		// TODO: Sort by distance from the current file
	}

	const getNamespaces = (currentFilePath: string) => {
		const workspaceFolder = workspace.getWorkspaceFolder(Uri.file(currentFilePath));
		if (!workspaceFolder) {
			window.showErrorMessage('No workspace selected');
			return;
		}

		const workspaceFolderPath = workspaceFolder.uri.fsPath;
		const relativeFilePath = path.parse(path.relative(workspaceFolderPath, currentFilePath));

		const namespaces = relativeFilePath.dir.split(path.sep)
		namespaces.push(relativeFilePath.name)

		return namespaces.filter(ns => ns.length > 0)
	}

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

	const getNamespacesSegments = (currentFilePath: string): Segment[] => {
		const splinters = getNamespaces(currentFilePath)
		if (!splinters) return []
		const segments: Segment[] = []
		const childName = splinters.pop()
		const parentNames = splinters
		if (parentNames.length) {
			segments.push([toNamespace(parentNames)])
		}
		if (childName) {
			segments.push([`structure ${childName} where`, 'deriving Repr, Inhabited, BEq, DecidableEq'])
			segments.push([toNamespace([childName])])
			// segments.push(['namespace Example'])
		}
		return segments
	}

	const toNamespace = (names: string[]) => `namespace ${names.join('.')}`

	let insertNamespacesCommand = commands.registerCommand('vscode-lean4-extra.insertNamespaces', () => {
		const editor = window.activeTextEditor;
		if (!editor) {
			window.showErrorMessage('No active editor found');
			return;
		}
		const text = combineAll(getNamespacesSegments(editor.document.fileName));

		if (text) {
			editor.edit(editBuilder => {
				editBuilder.insert(editor.selection.active, text);
			});
		}
	});

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

	let autoImportCommand = commands.registerCommand('vscode-lean4-extra.autoImport', async () => {
		await getImportFilename()
	});

	let debugCommand = commands.registerCommand('vscode-lean4-extra.doDebug', async () => {
		// await getImportFilename()
	});


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

	const join = (count: number = 1) => (lines: string[]) => lines.join('\n'.repeat(count))
	const glue = join(1)
	const combine = join(2)
	const joinAll = (count: number = 1) => (segments: Segment[]) => join(count)(segments.map(s => s.join('\n')))
	const glueAll = joinAll(1)
	const combineAll = joinAll(2)
	const joinAllSegments = (segmentsArray: Segment[][]) => joinAll(2)(segmentsArray.flat())

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
	context.subscriptions.push(debugCommand);
	context.subscriptions.push(completions);
}

// This method is called when your extension is deactivated
export function deactivate() { }

function getLeanImportPathFromAbsoluteFilePath(workspaceFolder: string, path: string) {
	return path.replace(workspaceFolder + sep, '').replace(new RegExp(sep, 'g'), '.').replace('.lean', '')
}

function getImportInsertPosition(editor: TextEditor) {
	const { selection, document } = editor
	const { start } = selection
	const { getText, positionAt } = document
	const text = getText()
	// // WARNING: The next line may result in the incorrect position being returned if the file contains `import` in some other location (not an import statement)
	// // TODO: Rewrite this hack
	const matches = text.matchAll(/^import\s/gm)
	const match = lastOfIterator(1024)(matches)
	const importOffset = match && match.index
	if (importOffset) {
		const importPosition = positionAt(importOffset)
		const nextLine = importPosition.line + 1;
		return new Position(nextLine, 0)
	} else {
		return new Position(0, 0)
	}
}

const lastOfIterator = (max: number = 1024) => <T>(iterator: IterableIterator<T>) => {
	let result: T | undefined = undefined
	let i = 0
	for (let item of iterator) {
		result = item
		i++;
		if (i >= max) return undefined
	}
	return result
};

