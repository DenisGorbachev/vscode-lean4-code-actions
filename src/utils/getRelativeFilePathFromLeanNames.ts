import { sep } from 'path'
import { Name } from 'src/models/Lean/Name'

export function getRelativeFilePathFromLeanNames(names: Name[]) {
  return names.join(sep) + '.lean'
}

