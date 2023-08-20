import { toString } from 'src/utils/Lean'
import { HieroName } from './HieroName'

export type Imports = HieroName[]

export type Opens = HieroName[][]

export type Derivings = HieroName[]

export function getImportLines(imports: Imports) {
  return imports.map(hieroname => `import ${toString(hieroname)}`)
}

export function getOpenLines(opens: Opens) {
  return opens.map(hieronames => `open ${hieronames.map(toString).join(' ')}`)
}

export function getImportLinesFromStrings(imports: string[]) {
  return imports.map(name => `import ${name}`)
}

export function getOpenLinesFromStrings(opens: string[]) {
  return opens.length ? [`open ${opens.join(' ')}`] : []
}
