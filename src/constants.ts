import { GlobPattern } from 'vscode'

export const leanFileExtensionShort = 'lean'

export const leanFileExtensionLong = '.' + leanFileExtensionShort

export const excludedDirs = ['build', 'lake-packages']

export const exclude: GlobPattern = `{${excludedDirs.join(',')}}`

export const isHidden = (filename: string) => filename.startsWith('.')

export const isExcluded = (filename: string) => excludedDirs.includes(filename)
