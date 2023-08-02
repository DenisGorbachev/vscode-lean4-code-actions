import { window } from 'vscode';

export async function convertTextToList() {
  const editor = window.activeTextEditor;
  if (!editor) {
    window.showErrorMessage('No active text editor');
    return;
  }

  const selection = editor.selection;
  const text = editor.document.getText(selection);
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length);
  const linesRendered = lines.map(line => `"${line}"`).join(",\n");

  editor.edit(editBuilder => {
    editBuilder.replace(selection, linesRendered);
  });
}
