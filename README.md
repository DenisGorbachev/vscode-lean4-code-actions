# VSCode Lean 4 Code Actions

## Features

<!-- Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow. -->

Note: a custom language configuration is available as [a separate extension](https://github.com/DenisGorbachev/vscode-lean4-language-configuration).

### Auto-import

NOTE: Currently, auto-import works only for symbols that are present in the currently open files. This is a limitation of the Lean LSP server: it only searches symbols in the open files.

* If the user executes this command with empty selection (just puts a cursor on the name), then only the part captured by `getWordRangeAtPosition` is used. In particular, it doesn't capture hierarchical names. For example, given a name `Foo.Bar.Baz`, and the cursor at index 1 (after `F`), it will capture only `Foo`, not the full name.

<!-- ## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
 -->
