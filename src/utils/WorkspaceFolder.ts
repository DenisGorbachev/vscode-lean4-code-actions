import { sep } from 'path'
import { Name } from 'src/models/Lean/Name'
import { Uri, WorkspaceFolder, workspace } from 'vscode'
import { getRelativeFilePathFromLeanNames } from './Lean'

export function getUriFromLeanNames(workspaceFolder: WorkspaceFolder, names: Name[]) {
  const relativeFilePath = getRelativeFilePathFromLeanNames(names)
  const absoluteFilePath = workspaceFolder.uri.fsPath + sep + relativeFilePath
  return workspaceFolder.uri.with({ path: absoluteFilePath })
}

export function getLeanNamesFromUri(uri: Uri) {
  const relativeFilePath = workspace.asRelativePath(uri)
  return relativeFilePath.replace('.lean', '').split(sep)
}
