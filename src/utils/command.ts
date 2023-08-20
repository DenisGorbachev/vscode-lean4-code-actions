import { commands } from 'vscode'

export const executeCommandsIfExist = async <T = unknown>(commands: string[], ...args: unknown[]): Promise<Array<T | undefined>> => {
  const promises = commands.map(command => executeCommandIfExists<T>(command, ...args))
  return Promise.all(promises)
}

export const executeCommandIfExists = async <T = unknown>(command: string, ...args: unknown[]): Promise<T | undefined> => {
  const commandNames = await commands.getCommands()
  return commandNames.includes(command) ? commands.executeCommand(command) : undefined
}

export const executeSubcommandIfExists = (commandPrefix: string, ...args: unknown[]) => async <T = unknown>(subcommand: string): Promise<T | undefined> => {
  return executeCommandIfExists<T>(commandPrefix + '.' + subcommand, ...args)
}

