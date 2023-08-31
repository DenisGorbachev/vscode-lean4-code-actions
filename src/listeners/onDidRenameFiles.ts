import { isDefined } from 'remeda'
import { HieroName, toString } from 'src/models/Lean/HieroName'
import { HieroNameString } from 'src/models/Lean/HieroNameString'
import { getRangeFromOffsetAndLength } from 'src/utils/Range'
import { withWorkspaceEdit } from 'src/utils/WorkspaceEdit'
import { getLeanImportPathFromAbsoluteFilePath } from 'src/utils/path'
import { FileRename } from 'src/utils/vscode/FileRename'
import { escapeRegExp } from 'voca'
import { FileRenameEvent, ProgressLocation, window, workspace } from 'vscode'

interface HieroRename {
  oldName: HieroName
  newName: HieroName
}

interface HieroStringRename {
  oldName: HieroNameString
  newName: HieroNameString
}

export const onDidRenameFiles = async (event: FileRenameEvent) => {
  const uris = await workspace.findFiles('**/*.lean', '{build,lake-packages}')
  const renames = event.files.map(toRename).filter(isDefined)
  return window.withProgress({
    cancellable: true,
    location: ProgressLocation.Notification,
    title: 'Updating imports...',
  }, (progress, cancellationToken) => {
    return withWorkspaceEdit(async edit => {
      const total = uris.length
      const increment = 1 / total
      for (let index = 0; index < uris.length; index++) {
        const uri = uris[index]
        // opening a new document each time to keep the memory footprint low (otherwise we'll get OOM in large workspaces)
        const document = await workspace.openTextDocument(uri)
        const { getText, positionAt } = document
        const getRange = getRangeFromOffsetAndLength(positionAt)
        const text = getText()
        for (const rename of renames) {
          if (cancellationToken.isCancellationRequested) return
          const { oldName, newName } = rename
          const oldImport = `import ${oldName}`
          const newImport = `import ${newName}`
          const oldImportRegExp = new RegExp('^' + escapeRegExp(oldImport) + '$', 'gm')
          const matches = text.matchAll(oldImportRegExp)
          for (const match of matches) {
            const { index } = match
            if (index === undefined) continue
            const range = getRange(index, oldImport.length)
            edit.replace(uri, range, newImport)
          }
        }
        progress.report({ message: `${index + 1} of ${total} files processed`, increment })
      }
    }, cancellationToken)
  })
}

const toRename = ({ oldUri, newUri }: FileRename): HieroStringRename | undefined => {
  const oldUriWorkspaceFolder = workspace.getWorkspaceFolder(oldUri)
  const newUriWorkspaceFolder = workspace.getWorkspaceFolder(newUri)
  if (!oldUriWorkspaceFolder) return
  if (!newUriWorkspaceFolder) return
  const oldUriWFS = oldUriWorkspaceFolder.uri.toString()
  const newUriWFS = newUriWorkspaceFolder.uri.toString()
  if (oldUriWFS !== newUriWFS) return
  const oldUriS = oldUri.toString()
  const newUriS = newUri.toString()
  if (!oldUriS.endsWith('.lean')) return
  if (!newUriS.endsWith('.lean')) return
  const oldName = getLeanImportPathFromAbsoluteFilePath(oldUriWFS, oldUriS)
  const newName = getLeanImportPathFromAbsoluteFilePath(newUriWFS, newUriS)
  return { oldName, newName }
}

const toHieroStringRename = ({ oldName: prev, newName: next }: HieroRename): HieroStringRename => {
  return { oldName: toString(prev), newName: toString(next) }
}

