import { useCallback } from "react"
import { eventsInSelection } from "../../../../actions"
import { Point } from "../../../../entities/geometry/Point"
import { Selection } from "../../../../entities/selection/Selection"
import type { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useControlPane } from "../../../../hooks/useControlPane"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { usePlayer } from "../../../../hooks/usePlayer"
import { useQuantizer } from "../../../../hooks/useQuantizer"
import { useTrack } from "../../../../hooks/useTrack"

// 選択範囲外でクリックした場合は選択範囲をリセット
export const useCreateSelectionGesture = (): MouseGesture => {
  const {
    transform,
    selectedTrackId,
    getLocal,
    setSelection,
    setSelectedNoteIds,
  } = usePianoRoll()
  const { quantizeRound } = useQuantizer()
  const { selection: _selection } = usePianoRoll()
  const { getEvents } = useTrack(selectedTrackId)
  const { isPlaying, setPosition } = usePlayer()
  const { setSelectedEventIds } = useControlPane()

  return {
    onMouseDown: useCallback(
      (e: MouseEvent) => {
        let selection = _selection

        const local = getLocal(e)
        const start = transform.getNotePointFractional(local)
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
            const end = transform.getNotePointFractional(offsetPos)
            selection = Selection.fromPoints(
              { ...start, tick: quantizeRound(start.tick) },
              { ...end, tick: quantizeRound(end.tick) }
            )
            setSelection(selection)
          },
          onMouseUp: () => {
            if (selection === null) {
              return
            }

            if (Selection.isEmpty(selection)) {
              setSelection(null)
              setSelectedNoteIds([])
              return
            }

            // 選択範囲を確定して選択範囲内のノートを選択状態にする
            // Confirm the selection and select the notes in the selection state
            setSelectedNoteIds(
              eventsInSelection(getEvents(), selection).map((e) => e.id)
            )
          },
        })
      },
      [
        getLocal,
        setSelection,
        setSelectedNoteIds,
        _selection,
        getEvents,
        isPlaying,
        setPosition,
        transform,
        quantizeRound,
        setSelectedEventIds,
      ]
    ),
  }
}
