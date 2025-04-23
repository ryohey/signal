import { FC } from "react"
import {
  useArrangeCopySelection,
  useArrangeDeleteSelection,
  useArrangeDuplicateSelection,
  useArrangePasteSelection,
} from "../../actions"
import { useArrangeView } from "../../hooks/useArrangeView"
import { KeyboardShortcut } from "./KeyboardShortcut"

const SCROLL_DELTA = 24

export const ArrangeViewKeyboardShortcut: FC = () => {
  const { resetSelection, scrollBy, setOpenTransposeDialog } = useArrangeView()
  const arrangeDeleteSelection = useArrangeDeleteSelection()
  const arrangeCopySelection = useArrangeCopySelection()
  const arrangePasteSelection = useArrangePasteSelection()
  const arrangeDuplicateSelection = useArrangeDuplicateSelection()

  return (
    <KeyboardShortcut
      actions={[
        { code: "Escape", run: () => resetSelection() },
        { code: "Delete", run: () => arrangeDeleteSelection() },
        { code: "Backspace", run: () => arrangeDeleteSelection() },
        {
          code: "ArrowUp",
          metaKey: true,
          run: () => scrollBy(0, SCROLL_DELTA),
        },
        {
          code: "ArrowDown",
          metaKey: true,
          run: () => scrollBy(0, -SCROLL_DELTA),
        },
        {
          code: "KeyT",
          run: () => setOpenTransposeDialog(true),
        },
        {
          code: "KeyD",
          metaKey: true,
          run: () => arrangeDuplicateSelection(),
        },
      ]}
      onCut={() => {
        arrangeCopySelection()
        arrangeDeleteSelection()
      }}
      onCopy={() => arrangeCopySelection()}
      onPaste={() => arrangePasteSelection()}
    />
  )
}
