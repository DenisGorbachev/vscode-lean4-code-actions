import { QuickPickItem } from 'vscode'

export interface GenericQuickPickItem<T> extends QuickPickItem {
  getValue: () => Promise<T>
}

export interface StaticQuickPickItem<T> extends QuickPickItem {
  value: T
}
