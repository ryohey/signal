import { Point, type Rect } from "@signal-app/geometry"
import { useCallback } from "react"
import type { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { useControlPane } from "../hooks/useControlPane"

// Selects the vertices inside the dragged bounding box. The selection can then
// be moved as a group by dragging any of the selected vertices.
export const useBoxSelectGesture = (): MouseDownHandler<
  [Point, readonly (Point & { id: number })[], (rect: Rect | null) => void]
> => {
  const { setSelection: setPianoRollSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { setSelectedEventIds, setSelection } = useControlPane()

  return useCallback(
    (e, startPoint, vertices, onChangeRect) => {
      setSelectedEventIds([])
      setSelection(null)
      setPianoRollSelection(null)
      setSelectedNoteIds([])

      let selectedKey = ""

      observeDrag2(e, {
        onMouseMove: (_e, delta) => {
          const end = Point.add(startPoint, delta)
          const rect: Rect = {
            x: Math.min(startPoint.x, end.x),
            y: Math.min(startPoint.y, end.y),
            width: Math.abs(delta.x),
            height: Math.abs(delta.y),
          }
          onChangeRect(rect)

          const ids = vertices
            .filter(
              (v) =>
                v.x >= rect.x &&
                v.x <= rect.x + rect.width &&
                v.y >= rect.y &&
                v.y <= rect.y + rect.height,
            )
            .map((v) => v.id)
          const key = ids.join(",")
          if (key !== selectedKey) {
            selectedKey = key
            setSelectedEventIds(ids)
          }
        },
        onMouseUp: () => onChangeRect(null),
      })
    },
    [
      setSelectedEventIds,
      setSelection,
      setPianoRollSelection,
      setSelectedNoteIds,
    ],
  )
}
