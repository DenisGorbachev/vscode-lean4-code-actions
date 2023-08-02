import * as path from 'path';

function stripExtension(filename: string) {
  const parsed = path.parse(filename);
  return path.join(parsed.dir, parsed.name);
}
