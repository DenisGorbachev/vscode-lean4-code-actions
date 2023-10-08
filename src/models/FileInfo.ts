import { not } from 'libs/generic/models/Filter'
import { ensureByIndex } from 'libs/utils/ensure'
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

export const getFileInfo = (pathname: string): FileInfo => {
  const { dir, name: basename } = path.parse(pathname)
  const dirSplinters = dir.split(path.sep).filter(not(isEmpty))
  const basenameSplinters = basename.split(fileTagsSeparator).filter(not(isEmpty))
  const lib = ensureByIndex(dirSplinters, 0)
  const namespace = dirSplinters.slice(1)
  const name = ensureByIndex(basenameSplinters, 0)
  const tags = basenameSplinters.slice(1)
  return { lib, namespace, name, tags }
}

export const getFileInfoFromUri = (uri: Uri) => {
  const relativeFilePath = getRelativePathFromUri(uri)
  return getFileInfo(relativeFilePath)
}
