import { sep } from 'path'

export function getRelativeFilePathFromAbsoluteFilePath(workspaceFolder: string, path: string): string {
  return path.replace(workspaceFolder + sep, '')
}

export function getLeanImportPathFromRelativeFilePath(path: string) {
  return path.replace(new RegExp(sep, 'g'), '.').replace('.lean', '')
}

export function getLeanImportPathFromAbsoluteFilePath(workspaceFolder: string, path: string) {
  return getLeanImportPathFromRelativeFilePath(getRelativeFilePathFromAbsoluteFilePath(workspaceFolder, path))
}
