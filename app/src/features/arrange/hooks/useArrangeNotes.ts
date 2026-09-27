import { useMemo } from "react"
import { useDerivedValue } from "../../../hooks/useDerivedValue"
import { useArrangeEditor } from "./useArrangeEditor"
import { useArrangeNoteTransform } from "./useArrangeNoteTransform"
import { useArrangeTransform } from "./useArrangeTransform"

const NOTE_RECT_HEIGHT = 1

export function useArrangeNotes() {
  const { trackTransform } = useArrangeTransform()
  const { transform } = useArrangeNoteTransform()
  const arrangeEditor = useArrangeEditor()

  const notes = useDerivedValue(
    arrangeEditor.observeItems,
    arrangeEditor.listNotes,
  )

  return useMemo(
    () =>
      notes.map((e) => {
        const rect = transform.getRect(e.event)
        return {
          ...rect,
          height: NOTE_RECT_HEIGHT,
          y: trackTransform.getY(e.trackIndex) + rect.y,
        }
      }),
    [notes, transform, trackTransform],
  )
}
