import { FileType, Uri, workspace } from 'vscode'

export function ensureWorkspaceFolder(uri: Uri) {
  const workspaceFolder = workspace.getWorkspaceFolder(uri)
  if (!workspaceFolder) throw new Error(`Cannot get a workspace folder for "${uri}"`)
  return workspaceFolder
}

export const getTopLevelDirectoryEntries = async (uri: Uri) => {
  const workspaceFolder = workspace.getWorkspaceFolder(uri)
  if (!workspaceFolder) return undefined
  const results = await workspace.fs.readDirectory(workspaceFolder.uri)
  return results.filter(r => r[1] === FileType.Directory).map(r => r[0])
}
