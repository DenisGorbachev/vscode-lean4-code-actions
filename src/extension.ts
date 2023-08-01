// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { identity, last } from 'remeda';
import { kebabCase } from 'lodash'
import { nail } from './utils/string';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { Exports } from 'lean4/src/exports'
import { WorkspaceSymbol } from 'vscode-languageserver-types'

function stripExtension(filename: string) {
	const parsed = path.parse(filename);
	return path.join(parsed.dir, parsed.name);
}

type Line = string
type Segment = Line[]

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-lean4-extra" is now active!');

	const getSelection = () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		// const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active)
		// return editor.document.getText(wordRange)
		return editor.document.getText(editor.selection)
	}

	const getImportFilename = async () => {
		// console.log('>>> getImportFilename')
		const languages = await vscode.languages.getLanguages()
		const leanExtensionId = 'leanprover.lean4';
		const leanExtension = vscode.extensions.getExtension(leanExtensionId);
		if (!leanExtension) {
			vscode.window.showErrorMessage(`${leanExtensionId} extension is not available`);
			return;
		}
		const { clientProvider } = leanExtension.exports as Exports
		if (!clientProvider) {
			vscode.window.showErrorMessage(`${leanExtensionId} extension.clientProvider is not available`);
			return;
		}
		const client = clientProvider.getActiveClient()
		if (!client) {
			vscode.window.showErrorMessage(`${leanExtensionId} extension.clientProvider.getActiveClient() is not available`);
			return;
		}
		const query = getSelection()
		if (!query) {
			vscode.window.showWarningMessage(`Text selection is empty: please select the name for auto-import in the editor`);
			return;
		}
		const response: WorkspaceSymbol[] | null = await client.sendRequest('workspace/symbol', {
			query
		}).catch((e) => {
			if (e instanceof Error) {
				vscode.window.showErrorMessage(e.toString());
				return;
			} else {
				vscode.window.showErrorMessage(`Unknown error occurred while sending a request to LSP: ${e}`);
				return;
			}
		})
		if (!response) {
			vscode.window.showErrorMessage(`Received a null response from LSP`);
			return;
		}
		console.log(response)
		vscode.window.showInformationMessage('Executed successfully');
		// TODO: Show a picker
		// TODO: Sort by distance from the current file
	}

	const getNamespaces = (currentFilePath: string) => {
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentFilePath));
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('No workspace selected');
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

	let insertNamespacesCommand = vscode.commands.registerCommand('vscode-lean4-extra.insertNamespaces', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found');
			return;
		}
		const text = combineAll(getNamespacesSegments(editor.document.fileName));

		if (text) {
			editor.edit(editBuilder => {
				editBuilder.insert(editor.selection.active, text);
			});
		}
	});

	let createFreewriteFileCommand = vscode.commands.registerCommand('vscode-lean4-extra.createFreewriteFile', async () => {
		const { workspaceFolders } = vscode.workspace
		if (!workspaceFolders) {
			vscode.window.showErrorMessage('No workspace folders found');
			return;
		}

		const workspaceFolder = workspaceFolders[0];
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('No workspace folder found');
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
		await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filename));
	});

	let textToListCommand = vscode.commands.registerCommand('vscode-lean4-extra.textToList', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor');
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

	let autoImportCommand = vscode.commands.registerCommand('vscode-lean4-extra.autoImport', async () => {
		await getImportFilename()
	});

	let debugCommand = vscode.commands.registerCommand('vscode-lean4-extra.doDebug', async () => {
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
		const text = await vscode.env.clipboard.readText()
		try {
			const result = path.parse(text)
			const leanPath = getLeanNamesFromParsedPath(result)
			return `import ${getLeanPathFromLeanNames(leanPath)}`
		} catch (e) {
			if (e instanceof Error) {
				vscode.window.showErrorMessage(e.toString());
				// vscode.window.showErrorMessage('The clipboard does not contain a valid filesystem path');
			} else {
				vscode.window.showErrorMessage('Unknown error occurred');
			}
			return;
		}
	}

	const getVariableShorthand = (currentFilePath: string) => {
		const namespaces = getNamespaces(currentFilePath)
		if (!namespaces) return;
		const typeName = namespaces.pop()
		if (!typeName) {
			vscode.window.showErrorMessage('Could not find a type name');
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

	const getCompletionItem = (label: string | vscode.CompletionItemLabel, kind?: vscode.CompletionItemKind) => (props: Partial<vscode.CompletionItem>) => {
		const item = new vscode.CompletionItem(label, kind)
		return Object.assign(item, props)
	}

	const getCompletionItemInsertText = (label: string | vscode.CompletionItemLabel, kind?: vscode.CompletionItemKind) => (insertText: string) => getCompletionItem(label, kind)({ insertText })

	const getCompletionItemInsertTextSimple = (label: string | vscode.CompletionItemLabel, insertText: string) => getCompletionItem(label)({ insertText })
	const getCompletionItemITS = getCompletionItemInsertTextSimple

	const completions = vscode.languages.registerCompletionItemProvider(
		{
			scheme: 'file',
		},
		{
			async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const gen = new vscode.CompletionItem('gen')
				gen.insertText = joinAllSegments([getGenericImports()])
				const ns = new vscode.CompletionItem('ns')
				ns.insertText = joinAllSegments([getNamespacesSegments(document.fileName)])
				const nsgen = new vscode.CompletionItem('nsgen')
				nsgen.insertText = joinAllSegments([getGenericImports(), getNamespacesSegments(document.fileName)])
				const imp = new vscode.CompletionItem('imp')
				imp.insertText = getImportShorthand(document.fileName)
				const cimp = new vscode.CompletionItem('cimp')
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
