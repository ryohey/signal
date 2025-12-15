import { Point } from "../../../../entities/geometry/Point"
import { ControlSelection } from "../../../../entities/selection/ControlSelection"
import { ControlCoordTransform } from "../../../../entities/transform/ControlCoordTransform"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useControlPane } from "../../../../hooks/useControlPane"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { usePlayer } from "../../../../hooks/usePlayer"
import { useQuantizer } from "../../../../hooks/useQuantizer"

export const useCreateSelectionGesture = () => {
  const { setSelection: setPianoRollSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { isPlaying, setPosition } = usePlayer()
  const { setSelectedEventIds, setSelection } = useControlPane()
  let { selection } = useControlPane()
  const { quantizeRound } = useQuantizer()

  return {
    onMouseDown(
      e: MouseEvent,
      startPoint: Point,
      controlTransform: ControlCoordTransform,
      getControllerEventIdsInSelection: (
        selection: ControlSelection,
      ) => number[],
    ) {
      setSelectedEventIds([])

      const startTick = quantizeRound(controlTransform.getTick(startPoint.x))

      setPianoRollSelection(null)
      setSelectedNoteIds([])

      if (!isPlaying) {
        setPosition(startTick)
      }

      selection = {
        fromTick: startTick,
        toTick: startTick,
      }
      setSelection(selection)

      observeDrag2(e, {
        onMouseMove: (_e, delta) => {
          const local = Point.add(startPoint, delta)
          const endTick = quantizeRound(controlTransform.getTick(local.x))
          selection = {
            fromTick: Math.min(startTick, endTick),
            toTick: Math.max(startTick, endTick),
          }
          setSelection(selection)
        },
        onMouseUp: () => {
          setSelectedEventIds(
            selection ? getControllerEventIdsInSelection(selection) : [],
          )
          setSelection(null)
        },
      })
    },
  }
}
