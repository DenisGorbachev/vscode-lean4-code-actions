import { nail } from 'libs/utils/string'
import { createFileIfNotExists } from 'src/utils/WorkspaceEdit'
import { commands, window, workspace } from 'vscode'

export async function createFreewriteFile() {
  const { workspaceFolders } = workspace
  if (!workspaceFolders) {
    window.showErrorMessage('No workspace folders found')
    return
  }

  const workspaceFolder = workspaceFolders[0]
  if (!workspaceFolder) {
    window.showErrorMessage('No workspace folder found')
    return
  }

  const root = workspaceFolder.uri.fsPath
  const now = new Date()

  const ns = getFreewriteNamespace(now)
  const path = `${root}/Freewrite/${ns}.lean`
  const uri = workspaceFolder.uri.with({ path })
  const content = getFreewriteFileContent(ns)
  await createFileIfNotExists(uri, content, { overwrite: false })
  await commands.executeCommand('vscode.open', uri)
}

const getFreewriteFileContent = (namespace: string) => {
  return nail(`
		import Playbook.Std
		import Playbook.Generic
		
		open Playbook Std Generic
		
		namespace Freewrite
		
		namespace ${namespace}
		
		def thoughts : Thoughts := []

		def wishes : Thoughts := []
	`).trim()
}

export const getFreewriteNamespace = (now: Date) => 'on_' + now.toISOString().slice(0, 10).replace(/-/g, '_')
