import { Position, TextEditor, window } from 'vscode';
import { lastOfIterator } from './IterableIterator';

export function getImportInsertPosition(editor: TextEditor) {
  const { selection, document } = editor;
  const { start } = selection;
  const { getText, positionAt } = document;
  const text = getText();
  // // WARNING: The next line may result in the incorrect position being returned if the file contains `import` in some other location (not an import statement)
  // // TODO: Rewrite this hack
  const matches = text.matchAll(/^import\s/gm);
  const match = lastOfIterator(1024)(matches);
  const importOffset = match && match.index;
  if (importOffset) {
    const importPosition = positionAt(importOffset);
    const nextLine = importPosition.line + 1;
    return new Position(nextLine, 0);
  } else {
    return new Position(0, 0);
  }
}

export const getSelectionText = (editor: TextEditor) => {
  // const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active)
  // return editor.document.getText(wordRange)
  return editor.document.getText(editor.selection)
};

export async function deleteSelection(editor: TextEditor) {
  await editor.edit(builder => builder.delete(editor.selection));
}

export const ensureEditor = () => {
  const { activeTextEditor } = window;
  if (!activeTextEditor) throw new Error('No active editor found');
  return activeTextEditor
};
