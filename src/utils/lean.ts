import * as path from 'path';
import { Uri, workspace } from 'vscode';
import { Segment } from './text';

export const getNames = (filePath: string) => {
  const workspaceFolder = workspace.getWorkspaceFolder(Uri.file(filePath));
  if (!workspaceFolder) throw new Error(`Cannot get a workspace folder for file path: "${filePath}"`);

  const workspaceFolderPath = workspaceFolder.uri.fsPath;
  const relativeFilePath = path.parse(path.relative(workspaceFolderPath, filePath));

  const names = relativeFilePath.dir.split(path.sep);
  names.push(relativeFilePath.name);

  return names.filter(ns => ns.length > 0);
};

export const ensureNames = (filePath: string) => {
  const namespaces = getNames(filePath)
  if (!namespaces) throw new Error(`Cannot extract names from file path: "${filePath}"`)
  return namespaces
};

export const toNamespace = (names: string[]) => `namespace ${names.join('.')}`;

export const getNamespacesSegments = (currentFilePath: string): Segment[] => {
  const splinters = getNames(currentFilePath);
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
