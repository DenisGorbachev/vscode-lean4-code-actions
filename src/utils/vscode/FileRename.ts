import { Uri } from 'vscode'
import { hasExtension as hasExtensionUri } from '../Uri'

export interface FileRename { readonly oldUri: Uri; readonly newUri: Uri }

export const hasExtension = (extension: string) => ({ oldUri, newUri }: FileRename) => {
  const hasExtensionLocal = hasExtensionUri(extension)
  return hasExtensionLocal(oldUri) && hasExtensionLocal(newUri)
}
