import { useMemo } from "react"
import { useAllNotesEventView } from "./useAllNotesEventView"
import { useArrangeNoteTransform } from "./useArrangeNoteTransform"
import { useArrangeTransform } from "./useArrangeTransform"

const NOTE_RECT_HEIGHT = 1

export function useArrangeNotes() {
  const { trackTransform } = useArrangeTransform()
  const { transform } = useArrangeNoteTransform()
  const events = useAllNotesEventView()

  return useMemo(
    () =>
      events.map((e) => {
        const rect = transform.getRect(e.event)
        return {
          ...rect,
          height: NOTE_RECT_HEIGHT,
          y: trackTransform.getY(e.trackIndex) + rect.y,
        }
      }),
    [events, transform, trackTransform],
  )
}
