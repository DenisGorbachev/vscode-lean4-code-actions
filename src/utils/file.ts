import { Mode, ObjectEncodingOptions, OpenMode, PathLike } from 'fs';
import { access, mkdir, writeFile } from 'fs/promises';
import { Abortable } from 'node:events';
import { Stream } from 'node:stream';
import * as path from 'path';
import { dirname } from 'path';

export function stripExtension(filename: string) {
  const parsed = path.parse(filename);
  return path.join(parsed.dir, parsed.name);
}

export async function exists(filePath: PathLike) {
  return access(filePath).then(() => true, () => false);
}

export async function doWriteFile(
  filePath: string,
  content: string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream,
  options?:
    | (
      ObjectEncodingOptions & {
        mode?: Mode | undefined;
        flag?: OpenMode | undefined;
      } & Abortable
    )
    | BufferEncoding
    | null
) {
  const dirPath = dirname(filePath);
  if (!(await exists(dirPath))) await mkdir(dirPath, { recursive: true });
  await writeFile(filePath, content, options)
}
