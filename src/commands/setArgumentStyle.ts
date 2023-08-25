import { map, pipe, sortBy } from 'remeda'
import { nameUpper } from 'src/i18n/Lean/Argument/Style'
import { StaticQuickPickItem } from 'src/utils/QuickPickItem'
import { ensureEditor } from 'src/utils/TextEditor'
import { withWorkspaceEdit } from 'src/utils/WorkspaceEdit'
import { indexOf, lastIndexOf } from 'voca'
import { TextEditor, window } from 'vscode'
import { Pair } from '../../libs/utils/Pair'
import { getRangeFromOffsets } from '../utils/Range'
import { StyleCharacterPair, pairs } from './StyleCharacterPair'

export const setArgumentStyle = async () => {
  const editor = ensureEditor()
  const { document } = editor
  const { uri } = document
  const info = getClosestCharacterPairRangeInfo(editor, pairs)
  if (!info) throw new Error('Could not find any matching brackets around the cursor')
  const { pair, rangeOuter, rangeInner } = info
  const textInner = document.getText(rangeInner)
  const textOuter = document.getText(rangeOuter)
  const itemsRaw = getQuickPickItems(pairs)(textInner)
  const items = markCurrentItem(itemsRaw, textOuter)
  const item = await window.showQuickPick(items, {
    placeHolder: 'Pick the new argument style',
  })
  if (!item) return
  await withWorkspaceEdit(async edit => {
    edit.replace(uri, rangeOuter, item.value)
  })
}

const getClosestCharacterPairRangeInfo = (editor: TextEditor, pairs: StyleCharacterPair[]) => {
  const { document, selection } = editor
  const { getText, offsetAt, positionAt } = document
  const getRange = getRangeFromOffsets(positionAt)
  const text = getText()
  const cursorOffset = offsetAt(selection.active)
  const { pair, offsetLeft, offsetRight } = getClosestStringPairWithOffsets(pairs, text, cursorOffset)
  const rangeOuter = getRange(offsetLeft, offsetRight + pair.right.length)
  const rangeInner = getRange(offsetLeft + pair.left.length, offsetRight)
  return { pair, rangeOuter, rangeInner }
}

const getClosestStringPairWithOffsets = <P extends Pair<string>>(pairs: P[], text: string, offsetCursor: number) => {
  const pairsWithRightOffsets = pipe(
    pairs,
    map(pair => {
      const offsetLeft = lastIndexOf(text, pair.left, offsetCursor)
      const offsetRight = indexOf(text, pair.right, offsetCursor)
      const distanceOffsetLeft = offsetCursor - offsetLeft
      const distanceOffsetRight = offsetRight - offsetCursor
      const distance = Math.min(distanceOffsetLeft, distanceOffsetRight)
      return ({
        pair,
        offsetRight,
        offsetLeft,
        distance,
      })
    }),
    pairs => pairs.filter(pi => ~pi.offsetLeft && ~pi.offsetRight),
    sortBy(pi => pi.distance)
  )
  return pairsWithRightOffsets[0]
}

const getQuickPickItems = (pairs: StyleCharacterPair[]) => (inner: string): StaticQuickPickItem<string>[] => {
  return pairs.map(pair => {
    const replacement = pair.left + inner + pair.right
    return ({
      label: nameUpper[pair.style],
      description: replacement,
      value: replacement,
    })
  })
}

const markCurrentItem = (items: StaticQuickPickItem<string>[], value: string) => {
  return items.map(item => {
    if (item.value === value) {
      return { ...item, description: item.description + ' (current)' }
    } else {
      return item
    }
  })
}
