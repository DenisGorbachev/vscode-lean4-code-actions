import { sep } from 'path'
import { FileInfo } from './FileInfo'
import { fileTagsSeparator } from './FileTag'
import { Name } from './Lean/Name'

export const safeCharactersRegExp = new RegExp('[a-zA-Z0-9_~.+-]')

export const getRelativeFilePath = (lib: string) => (namespace: Name[], name: Name) => (tags: Name[]) => {
  const filename = [name, ...tags].join(fileTagsSeparator) + '.lean'
  const dirname = [lib, ...namespace].join(sep)
  return sep + dirname + sep + filename
}

export const getRelativeFilePathFromFileInfo = ({ lib, namespace, name, tags }: FileInfo) => getRelativeFilePath(lib)(namespace, name)(tags)
