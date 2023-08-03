import { identity } from 'lodash';
import { sep } from 'path';
import { Uri, commands, window, workspace } from 'vscode';
import { deleteSelection, getSelectionText } from '../utils/TextEditor';
import { doWriteFile } from '../utils/file';
import { ensureNames, toNamespace } from '../utils/lean';
import { Line, Segment, combineAll } from '../utils/text';

const getMatchesStartingWith = (start: string) => (text: string) => {
  return text.match(new RegExp("^" + start + '.*', 'gm'))
};

const getImports = getMatchesStartingWith('import')
const getOpens = getMatchesStartingWith('open');

export async function moveDefinitionToNewFile() {
  const { activeTextEditor: editor } = window;
  const { fs } = workspace
  if (!editor) {
    window.showErrorMessage('No active editor found');
    return;
  }
  const { document } = editor
  const text = document.getText()
  const allImports = getImports(text) || []
  const allOpens = getOpens(text) || []
  const selection = getSelectionText(editor)
  const currentNamespaces = ensureNames(document.fileName).slice(0, -1)
  const selectionNamespaces = getSelectionNamespaces(selection)
  const filePath = getFilePath(editor.document.uri, currentNamespaces.concat(selectionNamespaces))
  const content = getContent(allImports, allOpens)(selection)(currentNamespaces, selectionNamespaces)
  await doWriteFile(filePath, content);
  await deleteSelection(editor)
  await commands.executeCommand('vscode.open', Uri.file(filePath));
}

function getFilePath(uri: Uri, names: string[]): any {
  const workspaceFolder = workspace.getWorkspaceFolder(uri)
  if (!workspaceFolder) throw new Error(`Cannot get a workspace folder for the file uri: "${uri}"`)
  return workspaceFolder.uri.fsPath + sep + names.join(sep) + '.lean'
}

const getSelectionNamespaces = (selection: string) => {
  // TODO: Rewrite this hack
  const namespacesRaw = getSecondStringWithoutSpaces(selection)
  if (!namespacesRaw) throw new Error('Selection is invalid: it does not contain any Lean names')
  return namespacesRaw.split('.')
};

const getContent = (allImports: Line[], allOpens: Line[]) => (selection: string) => (globalNames: string[], localNames: string[]) => {
  // const filePath = uri.toString();
  const segments: Segment[] = []
  segments.push(allImports)
  segments.push(allOpens)
  segments.push([toNamespace(globalNames)])
  segments.push([selection.trim()])
  segments.push([toNamespace(localNames)])
  return combineAll(segments)
};

function getSecondStringWithoutSpaces(selection: string) {
  return selection
    .split(' ')
    .map(s => s.trim())
    .filter(identity)
    .at(1);
}

