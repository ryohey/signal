import { eventsInSelection } from "../../../../actions"
import { Point } from "../../../../entities/geometry/Point"
import { Selection } from "../../../../entities/selection/Selection"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useControlPane } from "../../../../hooks/useControlPane"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { usePlayer } from "../../../../hooks/usePlayer"

export const useSelectNoteGesture = (): MouseGesture => {
  const {
    transform,
    quantizer,
    getLocal,
    setSelection,
    selectedTrack,
    setSelectedNoteIds,
  } = usePianoRoll()
  let { selection } = usePianoRoll()
  const { isPlaying, setPosition } = usePlayer()
  const { setSelectedEventIds } = useControlPane()

  return {
    onMouseDown(e) {
      const local = getLocal(e)
      const start = transform.getNotePoint(local)
      const startPos = local

      if (!isPlaying) {
        setPosition(quantizer.round(start.tick))
      }

      setSelectedEventIds([])
      selection = Selection.fromPoints(start, start)
      setSelection(selection)

      observeDrag2(e, {
        onMouseMove: (_e, delta) => {
          const offsetPos = Point.add(startPos, delta)
          const end = transform.getNotePoint(offsetPos)
          selection = Selection.fromPoints(start, end)
          setSelection(selection)
        },

        onMouseUp: () => {
          if (selection === null || selectedTrack === undefined) {
            return
          }

          // 選択範囲を確定して選択範囲内のノートを選択状態にする
          // Confirm the selection and select the notes in the selection state
          setSelectedNoteIds(
            eventsInSelection(selectedTrack.events, selection).map((e) => e.id),
          )

          setSelection(null)
        },
      })
    },
  }
}
