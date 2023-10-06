import * as path from 'path'
import { HieroName } from 'src/models/Lean/HieroName'
import { Uri, workspace } from 'vscode'
import { toString } from '../models/Lean/HieroName'
import { getLeanNamesFromUri } from './WorkspaceFolder'
import { Line } from './text'

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

export const toNamespace = (names: HieroName) => `namespace ${toString(names)}`

export const getNamespaceLinesFromFileName = (uri: Uri): Line[] => {
  const names = getLeanNamesFromUri(uri)
  return [toNamespace(names.slice(-1))]
}

export const getNamespaceLinesFromFilePath = (uri: Uri): Line[] => {
  const names = getLeanNamesFromUri(uri)
  return [toNamespace(names.slice(0, -1))]
}

export const toolchainMarker = 'leanprover'

export const packagesMarker = 'lake-packages'

