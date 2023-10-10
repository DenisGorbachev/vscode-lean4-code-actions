import { WorkspaceConfiguration } from 'vscode'

export const withImportsOpensDerivings = <T>(f: (imports: string[], opens: string[], derivings: string[]) => T) => (config: WorkspaceConfiguration) => {
  const imports = config.get<string[]>('imports', [])
  const opens = config.get<string[]>('opens', [])
  const derivings = config.get<string[]>('derivings', [])
  return f(imports, opens, derivings)
}

export const withImportsOpens = <T>(f: (imports: string[], opens: string[]) => T) => (config: WorkspaceConfiguration) => {
  const imports = config.get<string[]>('imports', [])
  const opens = config.get<string[]>('opens', [])
  return f(imports, opens)
}
