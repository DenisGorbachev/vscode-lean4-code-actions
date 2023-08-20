import * as path from 'path'
import { sep } from 'path'
import { HieroName } from 'src/models/Lean/HieroName'
import { Name } from 'src/models/Lean/Name'
import { Uri, workspace } from 'vscode'
import { Line } from './text'

export const leanNameSeparator = '.'

export const getNames = (uri: Uri) => {
  const workspaceFolder = workspace.getWorkspaceFolder(uri)
  if (!workspaceFolder) { throw new Error(`Cannot get a workspace folder for uri: "${uri}"`) }

  const workspaceFolderPath = workspaceFolder.uri.fsPath
  const relativeFilePath = path.parse(path.relative(workspaceFolderPath, uri.fsPath))

  const names = relativeFilePath.dir.split(path.sep)
  names.push(relativeFilePath.name)

  return names.filter(ns => ns.length > 0)
}

export const ensureNames = (uri: Uri) => {
  const namespaces = getNames(uri)
  if (!namespaces) { throw new Error(`Cannot extract names from uri: "${uri}"`) }
  return namespaces
}

export const toHieroName = (namespace: string): HieroName => namespace.split(leanNameSeparator)

export const toString = (names: HieroName): string => names.join(leanNameSeparator)

export const toNamespace = (names: HieroName) => `namespace ${toString(names)}`

export const getNamespaceLines = (uri: Uri): Line[] => {
  const splinters = getNames(uri)
  if (!splinters) { return [] }
  const childName = splinters.pop()
  if (!childName) return []
  return [toNamespace([childName])]
}

export function getRelativeFilePathFromLeanNames(names: Name[]) {
  return names.join(sep) + '.lean'
}

export const toolchainMarker = 'leanprover'

export const packagesMarker = 'lake-packages'

