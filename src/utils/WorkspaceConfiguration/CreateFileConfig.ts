import { WorkspaceConfiguration, workspace } from 'vscode'

export interface CreateFileConfig {
  imports: string[]
  opens: string[]
  derivings: string[]
}

export const getCreateFileConfig = (section: string) => {
  const configuration = workspace.getConfiguration(section)
  return getCreateFileConfigFromWorkspaceConfiguration(configuration)
}

export const getCreateFileConfigFromWorkspaceConfiguration = (config: WorkspaceConfiguration) => ({
  imports: config.get<string[]>('imports', []),
  opens: config.get<string[]>('opens', []),
  derivings: config.get<string[]>('derivings', []),
})
