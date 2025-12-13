import { useMemo } from "react"
import {
  useArrangeCopySelection,
  useArrangeCutSelection,
  useArrangeDeleteSelection,
  useArrangeDuplicateSelection,
  useArrangePasteSelection,
} from "../actions"
import { useArrangeView } from "./useArrangeView"
import { useKeyboardShortcut } from "./useKeyboardShortcut"

const SCROLL_DELTA = 24

export const useArrangeViewKeyboardShortcut = () => {
  const { resetSelection, scrollBy, setOpenTransposeDialog } = useArrangeView()
  const arrangeDeleteSelection = useArrangeDeleteSelection()
  const arrangeCopySelection = useArrangeCopySelection()
  const arrangePasteSelection = useArrangePasteSelection()
  const arrangeDuplicateSelection = useArrangeDuplicateSelection()
  const arrangeCutSelection = useArrangeCutSelection()

  const actions = useMemo(
    () => [
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
      {
        code: "KeyC",
        metaKey: true,
        run: () => arrangeCopySelection(),
      },
      {
        code: "KeyV",
        metaKey: true,
        run: () => arrangePasteSelection(),
      },
      {
        code: "KeyX",
        metaKey: true,
        run: () => arrangeCutSelection(),
      },
    ],
    [
      resetSelection,
      scrollBy,
      setOpenTransposeDialog,
      arrangeDeleteSelection,
      arrangeDuplicateSelection,
      arrangeCopySelection,
      arrangePasteSelection,
      arrangeCutSelection,
    ]
  )

  return useKeyboardShortcut({
    actions,
    onCut: arrangeCutSelection,
    onCopy: arrangeCopySelection,
    onPaste: arrangePasteSelection,
  })
}
