import { Segment, Segment } from "./text";
import { getNamespaces, toNamespace, toNamespace } from "./lean";
import * as path from 'path';
import { Uri, window, workspace } from 'vscode';

export function getNamespaces(currentFilePath: string) {
  const workspaceFolder = workspace.getWorkspaceFolder(Uri.file(currentFilePath));
  if (!workspaceFolder) {
    window.showErrorMessage('No workspace selected');
    return;
  }

  const workspaceFolderPath = workspaceFolder.uri.fsPath;
  const relativeFilePath = path.parse(path.relative(workspaceFolderPath, currentFilePath));

  const namespaces = relativeFilePath.dir.split(path.sep);
  namespaces.push(relativeFilePath.name);

  return namespaces.filter(ns => ns.length > 0);
}
export const toNamespace = (names: string[]) => `namespace ${names.join('.')}`;

export const getNamespacesSegments = (currentFilePath: string): Segment[] => {
  const splinters = getNamespaces(currentFilePath);
  if (!splinters) return [];
  const segments: Segment[] = [];
  const childName = splinters.pop();
  const parentNames = splinters;
  if (parentNames.length) {
    segments.push([toNamespace(parentNames)]);
  }
  if (childName) {
    segments.push([`structure ${childName} where`, 'deriving Repr, Inhabited, BEq, DecidableEq']);
    segments.push([toNamespace([childName])]);
    // segments.push(['namespace Example'])
  }
  return segments;
};
