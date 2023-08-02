import { window } from 'vscode';
import { combineAll } from '../utils/text';
import { getNamespacesSegments } from '../utils/lean';

export async function insertNamespaces() {
  const editor = window.activeTextEditor;
  if (!editor) {
    window.showErrorMessage('No active editor found');
    return;
  }
  const text = combineAll(getNamespacesSegments(editor.document.fileName));

  if (text) {
    editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, text);
    });
  }
}
