import { sep } from 'path'
import { Uri } from 'vscode'
import { ensureWorkspaceFolder } from './workspace'

export function getAbsoluteFilePathFromRelativeFilePath(uri: Uri, localFilePath: string) {
  const workspaceFolder = ensureWorkspaceFolder(uri)
  return workspaceFolder.uri.fsPath + sep + localFilePath
}

