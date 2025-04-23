import { Point } from "../../../../entities/geometry/Point"
import { ControlSelection } from "../../../../entities/selection/ControlSelection"
import { ControlCoordTransform } from "../../../../entities/transform/ControlCoordTransform"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useControlPane } from "../../../../hooks/useControlPane"
import { useStores } from "../../../../hooks/useStores"

export const useCreateSelectionGesture = () => {
  const { pianoRollStore, controlStore, player } = useStores()
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

      pianoRollStore.selection = null
      pianoRollStore.selectedNoteIds = []

      if (!player.isPlaying) {
        player.position = startTick
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
