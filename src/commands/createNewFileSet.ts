import { NonEmptyArray } from 'libs/utils/array/ensureNonEmptyArray'
import { last } from 'remeda'
import { toString } from 'src/models/Lean/HieroName'
import { Name } from 'src/models/Lean/Name'
import { withWorkspaceEdit } from 'src/utils/WorkspaceEdit'
import { getUriFromLeanNames } from 'src/utils/WorkspaceFolder'
import { ensureWorkspaceFolder } from 'src/utils/workspace'
import { WorkspaceEdit, WorkspaceFolder, commands } from 'vscode'
import { ensureEditor } from '../utils/TextEditor'
import { CreateFileConfig, getCreateFileConfig } from '../utils/WorkspaceConfiguration/CreateFileConfig'
import { getNamesFromEditor, getTypeFileContentsC, wrapFileContents } from './createNewFile'

export async function createNewFileSet() {
  const config = getCreateFileConfig('lean4CodeActions.createNewFile')
  const editor = ensureEditor()
  const workspaceFolder = ensureWorkspaceFolder(editor.document.uri)
  const names = await getNamesFromEditor(editor)
  if (names === undefined) return
  const mainUri = getUriFromLeanNames(workspaceFolder, names)
  const result = await withWorkspaceEdit(async edit => {
    createDataFile(workspaceFolder, config)(names)(edit)
    createLawsFile(workspaceFolder, config)(names)(edit)
    createMainFile(workspaceFolder, config)(names)(edit)
  })
  if (result === false) throw new Error('Edit could not be applied; maybe some files from the set already exist')
  await commands.executeCommand('vscode.open', mainUri)
}

const createDataFile = (workspaceFolder: WorkspaceFolder, config: CreateFileConfig) => (parents: NonEmptyArray<Name>) => (edit: WorkspaceEdit) => {
  const name = 'Data'
  const contents = getTypeFileContentsC(config)('structure', parents, name)
  createFileFromNames(workspaceFolder, edit, parents, name, contents)
}

const createLawsFile = (workspaceFolder: WorkspaceFolder, config: CreateFileConfig) => (parents: NonEmptyArray<Name>) => (edit: WorkspaceEdit) => {
  const name = 'Laws'
  const declarationLines = [
    `structure ${name} (data : Data) : Prop where`,
    '  ',
    'deriving Inhabited',
  ]
  const imports = [...config.imports, toString([...parents, 'Data'])]
  const opens = config.opens
  const contents = wrapFileContents(imports, opens)(parents, name)(declarationLines)
  createFileFromNames(workspaceFolder, edit, parents, name, contents)
}

const createMainFile = (workspaceFolder: WorkspaceFolder, config: CreateFileConfig) => (names: NonEmptyArray<Name>) => (edit: WorkspaceEdit) => {
  const name = last(names)
  const parents = names.slice(0, -1)
  const declarationLines = [
    `abbrev ${name} := @Subtype ${name}.Data ${name}.Laws`,
    '  ',
    `deriving instance Repr for ${name}`,
    '',
    `instance : Inhabited ${name} := ⟨{`,
    '  val := default,',
    '  property := by constructor',
    '}⟩',
  ]
  const imports = [...config.imports, toString([...names, 'Data']), toString([...names, 'Laws'])]
  const opens = config.opens
  const contents = wrapFileContents(imports, opens)(parents, name)(declarationLines)
  createFileFromNames(workspaceFolder, edit, parents, name, contents)
}

function createFileFromNames(workspaceFolder: WorkspaceFolder, edit: WorkspaceEdit, parents: Name[], name: Name, contents: string) {
  const uri = getUriFromLeanNames(workspaceFolder, parents.concat([name]))
  edit.createFile(uri, { contents: Buffer.from(contents) })
}

