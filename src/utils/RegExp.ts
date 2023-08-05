export function cloneRegExp(regexp: RegExp) {
  return new RegExp(regexp.source, regexp.flags)
}
