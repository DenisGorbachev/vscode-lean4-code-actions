# VSCode Lean 4 Code Actions

<p align="center">
  <img src="./img/autoImport.gif"/>
</p>

<p align="center" style="padding: 20px 0">
  <a href="https://marketplace.visualstudio.com/items?itemName=denis-gorbachev.lean4-code-actions&ssr=false">
    <img src="https://img.shields.io/badge/Install-VSCode%20Marketplace-blue" />
  </a>
</p>

## Installation

* [Install the extension](https://marketplace.visualstudio.com/items?itemName=denis-gorbachev.lean4-code-actions&ssr=false)
* Add the keyboard shortcuts to [useful commands](#commands)

Note: a custom language configuration is available as [a separate extension](https://github.com/DenisGorbachev/vscode-lean4-language-configuration).

## Commands

* [Auto-import a definition](#auto-import)
* [Extract definition to a separate file](#extract-definition-to-a-separate-file)
* [Create a new type in a separate file](#create-a-new-type-in-a-separate-file)
* [Find-replace the current word within a code block](#find-replace-the-current-word-within-a-code-block)
* [Convert a text block to a list of strings](#convert-a-text-block-to-a-list-of-strings)

### Auto-import

✅ Works

If you execute this command with an empty selection (just a cursor on the name), then only the part captured by [`getWordRangeAtPosition`](https://code.visualstudio.com/api/references/vscode-api#TextDocument.getWordRangeAtPosition) will be used. To import a hierarchical name, select it fully, then execute the command.

<!-- ## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
 -->

### Extract definition to a separate file

✅ Works

### Create a new type in a separate file

✅ Works

Configuration options:

* `lean4CodeActions.createNewTypeFile.imports` - a list of Lean filenames to be imported
* `lean4CodeActions.createNewTypeFile.opens` - a list of Lean namespaces to be opened
* `lean4CodeActions.createNewTypeFile.derivings` - a list of Lean names to be added to the `deriving` clause

### Find-replace the current word within a code block

✅ Works

**Before:**

```lean
def foo : IO String := do
  let text ← IO.FS.readFile "/tmp/secrets"
  return text
```

**After:**

```lean
def foo : IO String := do
  let secrets ← IO.FS.readFile "/tmp/secrets"
  return secrets
```

You can use it to rename a local binding (if the variable name is a unique string of characters across the code block).

**Gotchas:**

* It's a simple find-replace: it doesn't distinguish between variables and text within strings, for example.
* It's activated via "Rename Symbol" native command. If it causes problems, you can disable it by setting `lean4CodeActions.registerRenameProvider` to `false` in the extension configuration.

**Notes:**

* A code block is defined as a continuous list of non-blank lines.

### Convert a text block to a list of strings

✅ Works

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
