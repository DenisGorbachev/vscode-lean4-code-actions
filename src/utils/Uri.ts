import { sep } from 'path'
import { Uri } from 'vscode'
import { RelativePath } from './path'
import { ensureWorkspaceFolder } from './workspace'

export type UriString = string

export const startsWith = (a: Uri) => (b: Uri) => b.toString().startsWith(a.toString())

export const hasExtension = (extension: string) => (uri: Uri) => uri.toString().endsWith('.' + extension)

export const getAbsoluteFilePathFromRelativeFilePath = (uri: Uri, path: RelativePath) => {
  const workspaceFolder = ensureWorkspaceFolder(uri)
  return workspaceFolder.uri.fsPath + sep + path
}

