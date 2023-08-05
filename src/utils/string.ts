/**
 * Removes spaces at the beginning of each line (allows to indent multiline strings in code, then remove this indent via `nail()` call)
 * @see ./string.test.ts
 */
export const nail = (str: string) => {
  const spacesAtStart = str.match(/^\n(\s+)/)
  if (spacesAtStart) {
    return str.replace(new RegExp(`^[^\\S\r\n]{0,${spacesAtStart[1].length}}`, 'gm'), '')
  } else {
    return str
  }
}

export const longestCommonPrefix = (strings: string[]) => {
  // check border cases
  if (strings.length === 0) { return "" }
  if (strings.length === 1) { return strings[0] }
  let i = 0
  // while all words have the same character at position i, increment i
  while (strings[0][i] && strings.every(w => w[i] === strings[0][i])) { i++ }
  // prefix is the substring from the beginning to the last successfully checked i
  return strings[0].substring(0, i)
}
