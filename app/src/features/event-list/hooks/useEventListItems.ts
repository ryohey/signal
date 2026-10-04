import { useCallback, useEffect, useSyncExternalStore } from "react"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { useEventListEditor } from "./useEventListEditor"

export function useEventListItems() {
  const editor = useEventListEditor()
  const { selectedNoteIds } = usePianoRoll()

  useEffect(() => {
    editor.updateSelectedIds(selectedNoteIds)
  }, [editor, selectedNoteIds])

  return useSyncExternalStore(
    editor.onItemsChanged.subscribe,
    useCallback(() => editor.items, [editor]),
  )
}
