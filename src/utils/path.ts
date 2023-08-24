import { sep } from 'path'
import { escapeRegExp } from 'voca'
import { Precint } from './Lean/Lsp/WorkspaceSymbol'

export type AbsolutePath = string

export type RelativePath = string

const sepEsc = escapeRegExp(sep)

export function getRelativeFilePathFromAbsoluteFilePath(workspaceFolder: string, path: string): string {
  return path.replace(workspaceFolder + sep, '')
}

/**
 * NOTE: This function doesn't strip the "lake-packages/${package}" prefix
 */
export function getLeanImportPathFromRelativeFilePath(path: string) {
  return path.replace(new RegExp(sep, 'g'), '.').replace('.lean', '')
}

export function getLeanNamesFromWorkspaceSymbolFilePath(location: Precint) {
  const splinters = getLeanNameSplintersFromLocation(location)
  if (splinters.length) splinters[splinters.length - 1] = splinters[splinters.length - 1].replace('.lean', '')
  return splinters
}

function getLeanNameSplintersFromLocation(location: Precint) {
  const splinters = location.path.split(sep)
  switch (location.type) {
    case 'project':
      return splinters
    case 'package':
      return splinters.slice(2)
    case 'toolchain':
      return splinters.slice(3)
  }
}

export function getLeanImportPathFromAbsoluteFilePath(workspaceFolder: string, path: string) {
  return getLeanImportPathFromRelativeFilePath(getRelativeFilePathFromAbsoluteFilePath(workspaceFolder, path))
}
