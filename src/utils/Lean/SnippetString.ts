import { identity } from 'remeda'
import { NewTypeKeyword } from 'src/models/NewTypeKeyword'
import { SnippetString } from 'vscode'

export function getDeclarationSnippetLines(derivings: string[], keyword: NewTypeKeyword | null) {
  switch (keyword) {
    case 'inductive':
      return [
        `${keyword} \${1:Name} where`,
        '  | ${2:intro}${0}',
        derivings.length ? `deriving ${derivings.join(', ')}` : '',
      ]
    case 'structure':
    case 'class':
      return [
        `${keyword} \${1:Name} where`,
        '  ${0}',
        derivings.length ? `deriving ${derivings.join(', ')}` : '',
      ]
    case 'abbrev':
    case 'def':
      return [
        `${keyword} \${1:Name} : sorry := \${0:sorry}`,
        '',
        derivings.length ? `deriving instance ${derivings.join(', ')} for \${1:Name}` : '',
      ]
    case null:
      return []
  }
}

export function getDeclarationSnippetString(derivings: string[], keyword: NewTypeKeyword | null) {
  return getSnippetStringFromSnippetLines(getDeclarationSnippetLines(derivings, keyword))
}

export function getSnippetStringFromSnippetLines(lines: string[]) {
  const str = lines.filter(identity).join('\n')
  return new SnippetString(str)
}
