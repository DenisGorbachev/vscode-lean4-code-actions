import { Uri, workspace } from 'vscode'

export function ensureWorkspaceFolder(uri: Uri) {
  const workspaceFolder = workspace.getWorkspaceFolder(uri)
  if (!workspaceFolder) throw new Error(`Cannot determine workspace folder for "${uri}"`)
  return workspaceFolder
}
