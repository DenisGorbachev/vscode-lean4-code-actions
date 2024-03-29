import { sep } from 'path'
import { packagesMarker, toolchainMarker } from 'src/utils/Lean'
import { RelativePath } from 'src/utils/path'
import { UriString } from '../../Uri'

export type PrecintType = 'project' | 'package' | 'toolchain'

export interface Precint {
  type: PrecintType
  path: RelativePath
}

export function getPrecintFromUri(workspaceFolder: UriString, uri: UriString): Precint {
  uri = uri.replace(workspaceFolder + sep, '')
  const toolchainMarkerIndex = uri.indexOf(toolchainMarker)
  if (~toolchainMarkerIndex) {
    return { type: 'toolchain', path: uri.substring(toolchainMarkerIndex) }
  }
  const packagesMarkerIndex = uri.indexOf(packagesMarker)
  if (~packagesMarkerIndex) {
    return { type: 'package', path: uri.substring(packagesMarkerIndex) }
  }
  if (~uri.indexOf('file://')) throw new Error(`Cannot parse symbol uri: ${uri}`)
  return { type: 'project', path: uri }
}

// // Don't throw an error: allow the user to see the symbol that causes the issue
// return '(cannot calculate symbol description)'
