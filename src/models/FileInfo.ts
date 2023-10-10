import { not } from 'libs/generic/models/Filter'
import path from 'path'
import { getRelativePathFromUri } from 'src/utils/Uri'
import { isEmpty } from 'voca'
import { Uri } from 'vscode'
import { fileTagsSeparator } from './FileTag'
import { Name } from './Lean/Name'

export interface FileInfo {
  lib: string
  namespace: Name[]
  name: Name
  tags: Name[]
}

export const getFileInfo = (pathname: string): FileInfo | undefined => {
  const { dir, name: basename } = path.parse(pathname)
  const dirSplinters = dir.split(path.sep).filter(not(isEmpty))
  const basenameSplinters = basename.split(fileTagsSeparator).filter(not(isEmpty))
  const lib = dirSplinters[0]
  if (!lib) return undefined
  const namespace = dirSplinters.slice(1)
  const name = basenameSplinters[0]
  if (!basenameSplinters) return undefined
  const tags = basenameSplinters.slice(1)
  return { lib, namespace, name, tags }
}

export const getFileInfoFromUri = (uri: Uri) => {
  const relativeFilePath = getRelativePathFromUri(uri)
  return getFileInfo(relativeFilePath)
}
