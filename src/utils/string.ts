export const longestCommonPrefix = (strings: string[]) => {
  // check border cases
  if (strings.length === 0) { return '' }
  if (strings.length === 1) { return strings[0] }
  let i = 0
  // while all words have the same character at position i, increment i
  while (strings[0][i] && strings.every(w => w[i] === strings[0][i])) { i++ }
  // prefix is the substring from the beginning to the last successfully checked i
  return strings[0].substring(0, i)
}
