import { sortBy } from 'lodash';
import { longestCommonPrefix } from '../utils/string';
import { Exports } from 'lean4/src/exports';
import { WorkspaceSymbol } from 'vscode-languageserver-types';
import { QuickPickItem, extensions, window } from 'vscode';
import { getImportInsertPosition, getSelectionText } from '../utils/TextEditor';
import { getLeanImportPathFromAbsoluteFilePath } from '../utils/path';

export async function moveDefinitionToNewFile() {
  // const editor = window.activeTextEditor;
  // if (!editor) {
  //   window.showErrorMessage('No active editor found');
  //   return;
  // }
  // // console.log('>>> getImportFilename')
  // const leanExtensionId = 'leanprover.lean4';
  // const leanExtension = extensions.getExtension(leanExtensionId);
  // if (!leanExtension) {
  //   window.showErrorMessage(`${leanExtensionId} extension is not available`);
  //   return;
  // }
  // const { clientProvider } = leanExtension.exports as Exports;
  // if (!clientProvider) {
  //   window.showErrorMessage(`${leanExtensionId} extension.clientProvider is not available`);
  //   return;
  // }
  // const client = clientProvider.getActiveClient();
  // if (!client) {
  //   window.showErrorMessage(`${leanExtensionId} extension.clientProvider.getActiveClient() is not available`);
  //   return;
  // }
  // const workspaceFolder = client.getWorkspaceFolder();
  // const query = getSelectionText(editor);
  // if (!query) {
  //   window.showWarningMessage(`Text selection is empty: please select the name for auto-import in the editor`);
  //   return;
  // }
  // const symbols: WorkspaceSymbol[] | null = await client.sendRequest('workspace/symbol', {
  //   query
  // }).catch((e) => {
  //   if (e instanceof Error) {
  //     window.showErrorMessage(e.toString());
  //     return;
  //   } else {
  //     window.showErrorMessage(`Unknown error occurred while sending a request to LSP: ${e}`);
  //     return;
  //   }
  // });
  // if (!symbols) {
  //   window.showErrorMessage(`Received a null response from LSP`);
  //   return;
  // }
  // const currentPath = getLeanImportPathFromAbsoluteFilePath(workspaceFolder, editor.document.fileName);
  // const symbolsAnchored = symbols.filter(({ name }) => name.endsWith(query));
  // const infosRaw = symbolsAnchored.map(({ name, location }) => {
  //   const path = getLeanImportPathFromAbsoluteFilePath(workspaceFolder, location.uri);
  //   return ({
  //     name,
  //     path,
  //     closeness: longestCommonPrefix([currentPath, path]).length
  //   });
  // });
  // const infos = sortBy(infosRaw, i => -i.closeness /* most close first */);
  // const items: QuickPickItem[] = infos.map((symbol, index) => ({
  //   label: symbol.name,
  //   description: symbol.path,
  //   picked: index === 0
  // }));
  // const result = await window.showQuickPick(items, {
  //   placeHolder: 'Pick a symbol',
  //   matchOnDescription: true
  // });
  // if (!result) return;
  // if (!result.description) throw new Error('Result must have a description');
  // const leanImportPath = result.description;
  // const insertPosition = getImportInsertPosition(editor);
  // editor.edit(editBuilder => {
  //   editBuilder.insert(insertPosition, `import ${leanImportPath}\n`);
  // });
}
