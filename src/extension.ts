// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-lean4-extra" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let helloWorld = vscode.commands.registerCommand('vscode-lean4-extra.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Lean 4 Extra!');
	});

	const getNamespacesText = (currentFilePath: string) => {
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentFilePath));
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('No workspace selected');
			return;
		}

		const workspaceFolderPath = workspaceFolder.uri.fsPath;
		const relativeFilePath = path.relative(workspaceFolderPath, currentFilePath);

		const splinters = relativeFilePath.split(path.sep)
		const childNamespace = splinters.pop()?.split('.').slice(0, -1).join('.')
		const parentNamespaces = splinters
		const segments = [
			parentNamespaces,
			[childNamespace]
		].filter(s => s.length)

		return segments.map(s => `namespace ${s.join('.')}`).join('\n\n')
	}

	let insertNamespaces = vscode.commands.registerCommand('vscode-lean4-extra.insertNamespaces', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found');
			return;
		}
		const text = getNamespacesText(editor.document.fileName);

		if (text) {
			editor.edit(editBuilder => {
				editBuilder.insert(editor.selection.active, text);
			});
		}
	});


	const datetime = vscode.languages.registerCompletionItemProvider(
		{
			scheme: 'file',
		},
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const completionItem = new vscode.CompletionItem('ns');
				completionItem.insertText = getNamespacesText(document.fileName)
				return [completionItem];
			},
		},
	);

	context.subscriptions.push(helloWorld);
	context.subscriptions.push(insertNamespaces);
	context.subscriptions.push(datetime);
}

// This method is called when your extension is deactivated
export function deactivate() { }
