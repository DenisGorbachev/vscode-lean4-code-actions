/**
 * Useful replacements:
 * - $1 - replaces the placeholder with its default value
 * 
 * Notes:
 * - Nested placeholders are not supported
 */
export const replaceSnippetVariables = (replacements: (string | undefined)[]) => (snippetLines: string[]) => {
  return replacements.reduce((snippetLines, replacement, index) => {
    if (replacement === undefined) return snippetLines
    return snippetLines.map(replaceSnippetVariableInLine(replacement, index))
  }, snippetLines)
}

export const replaceSnippetVariableInLine = (replacement: string, index: number) => (snippetLine: string) => {
  const regexp = new RegExp('\\$\\{' + index + '(?::([^\\}]*))?[^\\d\\}]*\\}', 'g')
  return snippetLine.replace(regexp, replacement)
}
