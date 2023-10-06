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

export const appendPath = (uri: Uri, path: string) => uri.with({ path: uri.path + path })

export const getRelativePathFromUri = (uri: Uri) => {
  const workspaceFolder = ensureWorkspaceFolder(uri)
  return uri.fsPath.substring(workspaceFolder.uri.fsPath.length)
}

