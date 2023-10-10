import { WorkspaceConfiguration, workspace } from 'vscode'

export interface CreateNewFileConfig {
  imports: string[]
  opens: string[]
  derivings: string[]
}

export const getCreateNewFileConfig = (section: string) => {
  const configuration = workspace.getConfiguration(section)
  return getCreateNewFileConfigFromWorkspaceConfiguration(configuration)
}

export const getCreateNewFileConfigFromWorkspaceConfiguration = (config: WorkspaceConfiguration) => ({
  imports: config.get<string[]>('imports', []),
  opens: config.get<string[]>('opens', []),
  derivings: config.get<string[]>('derivings', []),
})
