import { sep } from 'path'
import { leanFileExtensionLong } from 'src/constants'
import { Name } from 'src/models/Lean/Name'
import { trim } from 'voca'
import { Uri, WorkspaceFolder, workspace } from 'vscode'
import { appendPath } from './Uri'

export function getUriFromLeanNames(workspaceFolder: WorkspaceFolder, names: Name[]) {
  const relativeFilePath = getRelativeFilePathFromLeanNames(names)
  return appendPath(workspaceFolder.uri, relativeFilePath)
}

// export function getUriFromLeanNamespaceAndName(workspaceFolder: WorkspaceFolder, namespace: Name[], name: Name, tags: string[]) {
//   const relativeFilePath = getRelativeFilePathFromLeanNamespaceAndName(namespace, name, tags)
//   return appendPath(workspaceFolder.uri, relativeFilePath)
// }

// export function getRelativeFilePathFromLeanNamespaceAndName(namespace: Name[], name: Name, tags: string[]) {
//   return sep + namespace.map(removeQuotes).join(sep) + sep + [name, ...tags].join(fileTagsSeparator) + leanFileExtensionLong
// }

export function getLeanNamesFromUri(uri: Uri) {
  const relativeFilePath = workspace.asRelativePath(uri)
  return relativeFilePath.replace(leanFileExtensionLong, '').split(sep).map(addQuotes)
}

export function getRelativeFilePathFromLeanNames(names: Name[]) {
  return sep + names.map(removeQuotes).join(sep) + leanFileExtensionLong
}

export function addQuotes(str: string) {
  return hasSpecialCharacters(str) ? `«${str}»` : str
}

export function removeQuotes(name: Name) {
  return trim(name, '«»')
}

export function hasSpecialCharacters(str: string) {
  return str.match(/[^\w\d]/)
}

