import * as path from 'path'
import { getFileInfoFromUri } from 'src/models/FileInfo'
import { HieroName } from 'src/models/Lean/HieroName'
import { Uri, workspace } from 'vscode'
import { toString } from '../models/Lean/HieroName'
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

export const getNamespaceLinesFromFileName = (uri: Uri): Line[] | undefined => {
  const info = getFileInfoFromUri(uri)
  if (!info) return
  const { name } = info
  return [toNamespace([name])]
}

export const getNamespaceLinesFromFilePath = (uri: Uri): Line[] | undefined => {
  const info = getFileInfoFromUri(uri)
  if (!info) return
  const { namespace, name } = info
  return [toNamespace([...namespace, name])]
}

export const toolchainMarker = 'leanprover'

export const packagesMarker = 'lake-packages'

