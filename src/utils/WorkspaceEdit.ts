import { Uri, WorkspaceEdit, workspace } from 'vscode'

export const createFileIfNotExists = async (
  uri: Uri,
  contents: string,
  options?: {
    readonly overwrite?: boolean
    readonly ignoreIfExists?: boolean
  }
) => withWorkspaceEdit(async edit => {
  edit.createFile(uri, { contents: Buffer.from(contents), ...options })
})

export const withWorkspaceEdit = async (callback: (edit: WorkspaceEdit) => Promise<void>) => {
  const edit = new WorkspaceEdit()
  await callback(edit)
  await workspace.applyEdit(edit)
}
