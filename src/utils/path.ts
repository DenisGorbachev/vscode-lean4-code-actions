import { sep } from 'path';

export function getLeanImportPathFromAbsoluteFilePath(workspaceFolder: string, path: string) {
  return path.replace(workspaceFolder + sep, '').replace(new RegExp(sep, 'g'), '.').replace('.lean', '');
}
