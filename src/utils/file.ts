import { Mode, ObjectEncodingOptions, OpenMode, PathLike } from 'fs'
import { access, mkdir, writeFile } from 'fs/promises'
import { Abortable } from 'node:events'
import { Stream } from 'node:stream'
import * as path from 'path'
import { dirname } from 'path'

export function stripExtension(filename: string) {
  const parsed = path.parse(filename)
  return path.join(parsed.dir, parsed.name)
}

export async function exists(filePath: PathLike) {
  return access(filePath).then(() => true, () => false)
}

export type Content = string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream

export type WriteFileOptions =
  | (ObjectEncodingOptions & {
    mode?: Mode | undefined
    flag?: OpenMode | undefined
  } & Abortable)
  | BufferEncoding
  | null

export async function writeFileWithDir(filePath: string, content: Content, options?: WriteFileOptions) {
  const dir = dirname(filePath)
  await mkdir(dir, { recursive: true })
  return writeFile(filePath, content, options)
}

export async function writeFileWithDirThrowIfExists(filePath: string, content: Content, options?: WriteFileOptions) {
  const fileExists = await exists(filePath)
  if (fileExists) throw new Error(`File ${filePath} already exists`)
  return writeFileWithDir(filePath, content, options)
}
