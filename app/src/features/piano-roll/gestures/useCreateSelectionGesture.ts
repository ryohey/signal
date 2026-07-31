import { getNoteIdsInSelection } from "@signal-app/core"
import { Point } from "@signal-app/geometry"
import { useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { usePlayer } from "../../../hooks/usePlayer"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useTrackQuery } from "../../../hooks/useTrackQuery"
import { useControlPane } from "../../control-pane/hooks/useControlPane"
import { Selection } from "../entities/Selection"
import { useNoteCoordTransform } from "../hooks/useNoteCoordTransform"
import { usePianoRoll } from "../hooks/usePianoRoll"

// 選択範囲外でクリックした場合は選択範囲をリセット
export const useCreateSelectionGesture = (): MouseDownHandler => {
  const { selectedTrackId, setSelection, setSelectedNoteIds } = usePianoRoll()
  const { transform, getLocal } = useNoteCoordTransform()
  const { quantizeRound } = useQuantizer()
  const { selection: _selection } = usePianoRoll()
  const query = useTrackQuery(selectedTrackId)
  const { isPlaying, setPosition } = usePlayer()
  const { setSelectedEventIds } = useControlPane()

  return useCallback(
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
            { ...end, tick: quantizeRound(end.tick) },
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
          setSelectedNoteIds(query(getNoteIdsInSelection(selection)) ?? [])
        },
      })
    },
    [
      getLocal,
      setSelection,
      setSelectedNoteIds,
      _selection,
      query,
      isPlaying,
      setPosition,
      transform,
      quantizeRound,
      setSelectedEventIds,
    ],
  )
}
