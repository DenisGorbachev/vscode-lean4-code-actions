import { not } from 'libs/generic/models/Filter'
import path from 'path'
import { sep } from 'path/posix'
import { appendPath, getRelativePathFromUri } from 'src/utils/Uri'
import { ensureWorkspaceFolder } from 'src/utils/workspace'
import { isEmpty } from 'voca'
import { TextEditor, Uri } from 'vscode'
import { fileTagsSeparator } from './FileTag'
import { Name } from './Lean/Name'

export interface FileInfo {
  lib: string
  namespace: Name[]
  name: Name
  tags: Name[]
}

export function createFileInfo(lib: string, namespace: Name[], name: Name, tags: Name[]): FileInfo {
  return { lib, namespace, name, tags }
}

export const getFileInfo = (pathname: string): FileInfo | undefined => {
  const { dir, name: basename } = path.parse(pathname)
  const dirSplinters = dir.split(path.sep).filter(not(isEmpty))
  const basenameSplinters = basename.split(fileTagsSeparator).filter(not(isEmpty))
  const lib = dirSplinters[0]
  if (!lib) return undefined
  const namespace = dirSplinters.slice(1)
  const name = basenameSplinters[0]
  if (!name) return undefined
  const tags = basenameSplinters.slice(1)
  return { lib, namespace, name, tags }
}

export const getFileInfoFromUri = (uri: Uri) => {
  const relativeFilePath = getRelativePathFromUri(uri)
  return getFileInfo(relativeFilePath)
}

export const getFileInfoFromEditor = (editor: TextEditor) => {
  return getFileInfoFromUri(editor.document.uri)
}

export const getRelativeFilePath = (lib: string) => (namespace: Name[], name: Name) => (tags: Name[]) => {
  const filename = [name, ...tags].join(fileTagsSeparator) + '.lean'
  const dirname = [lib, ...namespace].join(sep)
  return sep + dirname + sep + filename
}

export const getRelativeFilePathFromFileInfo = ({ lib, namespace, name, tags }: FileInfo) => getRelativeFilePath(lib)(namespace, name)(tags)

export const getNewUri = (uri: Uri, info: FileInfo) => {
  const workspaceFolder = ensureWorkspaceFolder(uri)
  return appendPath(workspaceFolder.uri, getRelativeFilePathFromFileInfo(info))
}
