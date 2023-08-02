import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { Uri, commands, window, workspace } from 'vscode';
import { nail } from '../utils/string';

export async function createFreewriteFile() {
  const { workspaceFolders } = workspace;
  if (!workspaceFolders) {
    window.showErrorMessage('No workspace folders found');
    return;
  }

  const workspaceFolder = workspaceFolders[0];
  if (!workspaceFolder) {
    window.showErrorMessage('No workspace folder found');
    return;
  }

  const root = workspaceFolder.uri.fsPath;
  const now = new Date();

  const ns = getFreewriteNamespace(now);
  const filename = `${root}/Freewrite/${ns}.lean`;
  if (!existsSync(filename)) {
    const content = getFreewriteFileContent(ns);
    await writeFile(filename, content);
  }
  await commands.executeCommand('vscode.open', Uri.file(filename));
}

const getFreewriteFileContent = (namespace: string) => {
  return nail(`
		import Playbook.Std
		import Playbook.Generic
		
		open Playbook Std Generic
		
		namespace Freewrite
		
		namespace ${namespace}
		
		def thoughts : Thoughts := []

		def wishes : Thoughts := []
	`)
}

export const getFreewriteNamespace = (now: Date) => 'on_' + now.toISOString().slice(0, 10).replace(/-/g, '_');
