import { Style } from 'src/utils/Lean/Argument/Style'
import { Pair } from '../../libs/utils/Pair'

export interface StyleCharacterPair extends Pair<string> {
  style: Style
}

export const pairs: StyleCharacterPair[] = [
  { style: 'explicit', left: '(', right: ')' },
  { style: 'implicitStrong', left: '{', right: '}' },
  { style: 'implicitWeak', left: '⦃', right: '⦄' },
  { style: 'typeclass', left: '[', right: ']' },
]
