import { Name } from 'libs/generic/models/Name'
import { createFileInfo, getNewUri } from 'src/models/FileInfo'
import { ensureEditor } from 'src/utils/TextEditor'
import { createFileIfNotExists } from 'src/utils/WorkspaceEdit'
import { commands, workspace } from 'vscode'
import { wrapFileContentsFromConfigV2 } from './createNewFile'

export async function createFreewriteFile() {
  const config = workspace.getConfiguration('lean4CodeActions.createNewFile')
  const now = new Date()
  const editor = ensureEditor()
  const name = getFreewriteName(now)
  const info = createFileInfo('Playbook', ['Freewrite'], name, [])
  const uri = getNewUri(editor.document.uri, info)
  const contents = wrapFileContentsFromConfigV2(config)(info, null)(getFreewriteFileContent(name))
  await createFileIfNotExists(uri, contents, { overwrite: false })
  await commands.executeCommand('vscode.open', uri)
}

const getFreewriteFileContent = (name: Name) => {
  return [
    'def thoughts : Thoughts := []',
    '',
    'def wishes : Thoughts := []',
  ]
}

export const getFreewriteName = (now: Date) => 'on_' + now.toISOString().slice(0, 10).replace(/-/g, '_')
