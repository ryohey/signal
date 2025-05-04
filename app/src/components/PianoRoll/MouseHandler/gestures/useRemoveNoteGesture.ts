import { Point } from "../../../../entities/geometry/Point"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { useTrack } from "../../../../hooks/useTrack"

export const useRemoveNoteGesture = (): MouseGesture => {
  const { setSelectedNoteIds, selectedTrackId, getLocal, getNotes } =
    usePianoRoll()
  let { selectedNoteIds } = usePianoRoll()
  const { removeEvent: removeTrackEvent } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()

  const removeEvent = (eventId: number) => {
    pushHistory()
    removeTrackEvent(eventId)
    selectedNoteIds = selectedNoteIds.filter((id) => id !== eventId)
    setSelectedNoteIds(selectedNoteIds)
  }

  return {
    onMouseDown(e) {
      const startPos = getLocal(e)
      const items = getNotes(startPos)
      if (items.length > 0) {
        removeEvent(items[0].id)
      }

      observeDrag2(e, {
        onMouseMove: (_e, delta) => {
          const local = Point.add(startPos, delta)
          const items = getNotes(local)
          if (items.length > 0) {
            removeEvent(items[0].id)
          }
        },
      })
    },
  }
}
