import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { usePlayer } from "../../../hooks/usePlayer"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useTrack } from "../../../hooks/useTrack"
import { useControlPane } from "../../control-pane/hooks/useControlPane"
import { Selection } from "../entities/Selection"
import { eventsInSelection } from "../hooks/selection"
import { useNoteCoordTransform } from "../hooks/useNoteCoordTransform"
import { usePianoRoll } from "../hooks/usePianoRoll"

export const useSelectNoteGesture = (): MouseDownHandler => {
  const { setSelection, selectedTrackId, setSelectedNoteIds } = usePianoRoll()
  const { transform, getLocal } = useNoteCoordTransform()
  const { quantizeRound } = useQuantizer()
  let { selection } = usePianoRoll()
  const { getEvents } = useTrack(selectedTrackId)
  const { isPlaying, setPosition } = usePlayer()
  const { setSelectedEventIds } = useControlPane()

  return useCallback(
    (e) => {
      const local = getLocal(e)
      const start = transform.getNotePoint(local)
      const startPos = local

      if (!isPlaying) {
        setPosition(quantizeRound(start.tick))
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
          if (selection === null) {
            return
          }

          // 選択範囲を確定して選択範囲内のノートを選択状態にする
          // Confirm the selection and select the notes in the selection state
          setSelectedNoteIds(
            eventsInSelection(getEvents(), selection).map((e) => e.id),
          )

          setSelection(null)
        },
      })
    },
    [
      getEvents,
      isPlaying,
      quantizeRound,
      setPosition,
      setSelectedEventIds,
      setSelection,
      transform,
      selection,
      getLocal,
      setSelectedNoteIds,
    ],
  )
}
