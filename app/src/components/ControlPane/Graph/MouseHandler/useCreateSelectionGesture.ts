import { Point } from "../../../../entities/geometry/Point"
import { ControlSelection } from "../../../../entities/selection/ControlSelection"
import { ControlCoordTransform } from "../../../../entities/transform/ControlCoordTransform"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useControlPane } from "../../../../hooks/useControlPane"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { usePlayer } from "../../../../hooks/usePlayer"
import { useStores } from "../../../../hooks/useStores"

export const useCreateSelectionGesture = () => {
  const { controlStore } = useStores()
  const { setSelection: setPianoRollSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { isPlaying, setPosition } = usePlayer()
  const { setSelectedEventIds, setSelection, quantizer } = useControlPane()

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

      const startTick = quantizer.round(controlTransform.getTick(startPoint.x))

      setPianoRollSelection(null)
      setSelectedNoteIds([])

      if (!isPlaying) {
        setPosition(startTick)
      }

      setSelection({
        fromTick: startTick,
        toTick: startTick,
      })

      observeDrag2(e, {
        onMouseMove: (_e, delta) => {
          const local = Point.add(startPoint, delta)
          const endTick = quantizer.round(controlTransform.getTick(local.x))
          setSelection({
            fromTick: Math.min(startTick, endTick),
            toTick: Math.max(startTick, endTick),
          })
        },
        onMouseUp: () => {
          const { selection } = controlStore // read latest value from store
          if (selection === null) {
            return
          }

          setSelectedEventIds(getControllerEventIdsInSelection(selection))
          setSelection(null)
        },
      })
    },
  }
}
