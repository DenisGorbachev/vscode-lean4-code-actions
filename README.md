# VSCode Lean 4 Code Actions

## Features

* [Auto-import a definition](#auto-import)
* [Extract definition to a separate file](#extract-definition-to-a-separate-file)
* [Find-replace the current word within a code block](#find-replace-the-current-word-within-a-code-block)
* [Convert a text block to a list of strings](#convert-a-text-block-to-a-list-of-strings)

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

### Extract definition to a separate file

### Find-replace the current word within a code block

A code block is defined as a continuous list of non-blank lines.

Tip: you can use it to rename a local binding (if the variable name is a unique string of characters across the code block).

Note: this functionality is activated via "Rename Symbol" native command. Please open an issue if it causes problems.

### Convert a text block to a list of strings

**Before:**

```text
foo
bar
xyz
```

**After:**

```text
"foo",
"bar",
"xyz"
```

Each line becomes an element of the list.
