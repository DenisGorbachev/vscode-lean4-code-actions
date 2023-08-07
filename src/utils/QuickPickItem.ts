import { QuickPickItem, Uri } from 'vscode'

export interface GenericQuickPickItem<T> extends QuickPickItem {
  getValue: () => Promise<T>
}

export interface UriQuickPickItem extends QuickPickItem {
  uri: Uri
}
