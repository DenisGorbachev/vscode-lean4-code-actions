# Move definition

## Arguments

* `sourceLocation : Lean.Lsp.Location`
* `targetFile : Lean.Lsp.DocumentUri`

## Definitions

* `source : Lean.Name` -- the initial fully qualified name of the definition
* `target : Lean.Name` -- the final fully qualified name of the definition
* `sourceFile : Lean.Lsp.DocumentUri` -- the initial file uri of the definition
* `targetFile : Lean.Lsp.DocumentUri` -- the final file uri of the definition
* `relatedFiles : List Lean.Lsp.DocumentUri` -- the list of files that use the definition
  * `relatedFiles` contains the `sourceFile`

## Properties

The following list uses [the standard RFC keywords](https://www.ietf.org/rfc/rfc2119.txt).

* It must work for any top-level definition: `def`, `abbrev`, `inductive`, `structure`
  * It may work for `macro_rules`, `notation`, commands and other top-level syntax nodes, but it's not necessary in the first version
* It must work if `targetFile` already exists
  * It must create a `targetFile` if it doesn't exist
* It must add the necessary imports to `targetFile`
* It should add the necessary opens to `targetFile`
  * It must return an error if there is a name conflict
    * For example, if `targetFile` already contains an open with the same name that points to a different namespace)
* It must update the imports, opens, references of the definition in `relatedFiles`
* It must return an error if `target` already exists
* It must return an error if `target = source`
* It should put the definition under correct namespace in the target file
  * In the first version, it's acceptable to put the definition at the top level with a fully qualified name
* It may require the `targetFile` to have a specific structure
  * For example, it may require the `targetFile` to contain only a single namespace
  * This would simplify the implementation
* It must return an error if any of `relatedFiles` contain a syntax error
