import { Point } from "../../../../entities/geometry/Point"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useStores } from "../../../../hooks/useStores"

export const useRemoveNoteGesture = (): MouseGesture => {
  const {
    pianoRollStore,
    pianoRollStore: { selectedTrack },
    pushHistory,
  } = useStores()

  const removeEvent = (eventId: number) => {
    if (selectedTrack === undefined) {
      return
    }
    pushHistory()
    selectedTrack.removeEvent(eventId)
    pianoRollStore.selectedNoteIds = pianoRollStore.selectedNoteIds.filter(
      (id) => id !== eventId,
    )
  }

  return {
    onMouseDown(e) {
      const startPos = pianoRollStore.getLocal(e)
      const items = pianoRollStore.getNotes(startPos)
      if (items.length > 0) {
        removeEvent(items[0].id)
      }

      observeDrag2(e, {
        onMouseMove: (_e, delta) => {
          const local = Point.add(startPos, delta)
          const items = pianoRollStore.getNotes(local)
          if (items.length > 0) {
            removeEvent(items[0].id)
          }
        },
      })
    },
  }
}
