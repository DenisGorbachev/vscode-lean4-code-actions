import { Name } from 'libs/generic/models/Name'
import { nail } from 'libs/utils/string'
import { FileInfo } from 'src/models/FileInfo'
import { ensureEditor } from 'src/utils/TextEditor'
import { appendPath } from 'src/utils/Uri'
import { createFileIfNotExists } from 'src/utils/WorkspaceEdit'
import { ensureWorkspaceFolder } from 'src/utils/workspace'
import { commands } from 'vscode'

export async function createFreewriteFile() {
  const now = new Date()
  const editor = ensureEditor()
  const workspaceFolder = ensureWorkspaceFolder(editor.document.uri)
  const name = getFreewriteName(now)
  const info: FileInfo = createFileInfo('Playbook', ['Freewrite'], name, [])
  const uri = appendPath(workspaceFolder.uri, getRelativeFilePathFromFileInfo(info))
  const contents = getTypeFileContentsFromConfigV2(config)(info, keyword)
  await createFileIfNotExists(uri, contents)

  // const content = getFreewriteFileContent(ns)
  // await createFileIfNotExists(uri, content, { overwrite: false })
  await commands.executeCommand('vscode.open', uri)
}

const getFreewriteFileContent = (name: Name) => {
  const content = nail(`
    def thoughts : Thoughts := []

    def wishes : Thoughts := []
  `)

}

export const getFreewriteName = (now: Date) => 'on_' + now.toISOString().slice(0, 10).replace(/-/g, '_')
