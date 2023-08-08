import { sep } from 'path'
import { escapeRegExp } from 'voca'

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

export function getLeanNamesFromMaybeLakeRelativeFilePath(path: string) {
  const splintersRaw = path.split(sep)
  const splinters = splintersRaw[0] === 'lake-packages' ? splintersRaw.slice(2) : splintersRaw
  if (splinters.length) splinters[splinters.length - 1] = splinters[splinters.length - 1].replace('.lean', '')
  return splinters
}

export function getLeanImportPathFromAbsoluteFilePath(workspaceFolder: string, path: string) {
  return getLeanImportPathFromRelativeFilePath(getRelativeFilePathFromAbsoluteFilePath(workspaceFolder, path))
}
