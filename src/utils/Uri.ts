import { sep } from 'path'
import { Uri } from 'vscode'
import { RelativePath } from './path'
import { ensureWorkspaceFolder } from './workspace'

export function getAbsoluteFilePathFromRelativeFilePath(uri: Uri, path: RelativePath) {
  const workspaceFolder = ensureWorkspaceFolder(uri)
  return workspaceFolder.uri.fsPath + sep + path
}

export const startsWith = (a: Uri) => (b: Uri) => b.toString().startsWith(a.toString())

export type UriString = string;

