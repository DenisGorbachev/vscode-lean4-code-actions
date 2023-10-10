import { getUntilParseSchema } from 'libs/utils/zod/getUntilParseSchema'
import { merge } from 'remeda'
import { getFileInfoFromEditor, getNewUri } from 'src/models/FileInfo'
import { NewTypeKeywordSchema } from 'src/models/NewTypeKeyword'
import { withWorkspaceEdit } from 'src/utils/WorkspaceEdit'
import { Uri, WorkspaceEdit, window } from 'vscode'
import { z } from 'zod'
import { ensureEditor } from '../utils/TextEditor'

export async function renameDeclaration() {
  // const config = workspace.getConfiguration('lean4CodeActions.createNewFile')
  const editor = ensureEditor()
  const oldUri = editor.document.uri
  const oldInfo = getFileInfoFromEditor(editor)
  if (oldInfo === undefined) throw new Error('Cannot determine old file info')
  const oldName = oldInfo.name
  const newName = await askName(oldName)
  if (newName === undefined) return
  const newInfo = merge(oldInfo, { name: newName })
  const newUri = getNewUri(editor.document.uri, newInfo)
  return withWorkspaceEdit(async edit => {
    replaceDeclarationName(oldName, newName)(oldUri)(edit)
    replaceNamespace(oldName, newName)(oldUri)(edit)
    edit.renameFile(oldUri, newUri)
  })
}

const NewNameSchema = z.string().min(1)

const askName = async (oldName: string) => {
  return getUntilParseSchema(10, NewNameSchema)(async () => window.showInputBox({
    title: 'New name',
    value: oldName,
    valueSelection: [0, oldName.length],
  }))
}

const replaceDeclarationName = (oldName: string, newName: string) => (uri: Uri) => (edit: WorkspaceEdit) => {
  return NewTypeKeywordSchema.options.map(keyword => {
    const prev = `${keyword} ${oldName}`
    const next = `${keyword} ${newName}`
    findReplace(prev, next)(uri)(edit)
  })
}

const replaceNamespace = (oldName: string, newName: string) => (uri: Uri) => (edit: WorkspaceEdit) => {
  const prev = `namespace ${oldName}`
  const next = `namespace ${newName}`
  findReplace(prev, next)(uri)(edit)
}

import { workspace, Range, Position } from 'vscode'

const findReplace = (prev: string, next: string) => (uri: Uri) => async (edit: WorkspaceEdit) => {
  const document = await workspace.openTextDocument(uri)
  const text = document.getText()
  let startIndex = text.indexOf(prev)
  while (startIndex !== -1) {
    const endIndex = startIndex + prev.length
    const start = document.positionAt(startIndex)
    const end = document.positionAt(endIndex)
    const range = new Range(start, end)
    edit.replace(uri, range, next)
    startIndex = text.indexOf(prev, endIndex)
  }
}

