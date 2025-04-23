import { eventsInSelection } from "../../../../actions"
import { Point } from "../../../../entities/geometry/Point"
import { Selection } from "../../../../entities/selection/Selection"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useControlPane } from "../../../../hooks/useControlPane"
import { useStores } from "../../../../hooks/useStores"

export const useSelectNoteGesture = (): MouseGesture => {
  const {
    pianoRollStore,
    pianoRollStore: { transform, quantizer },
    player,
  } = useStores()
  const { setSelectedEventIds } = useControlPane()

  return {
    onMouseDown(e) {
      const local = pianoRollStore.getLocal(e)
      const start = transform.getNotePoint(local)
      const startPos = local

      if (!player.isPlaying) {
        player.position = quantizer.round(start.tick)
      }

      setSelectedEventIds([])
      pianoRollStore.selection = Selection.fromPoints(start, start)

      observeDrag2(e, {
        onMouseMove: (_e, delta) => {
          const offsetPos = Point.add(startPos, delta)
          const end = transform.getNotePoint(offsetPos)
          pianoRollStore.selection = Selection.fromPoints(start, end)
        },

        onMouseUp: () => {
          const { selection, selectedTrack } = pianoRollStore
          if (selection === null || selectedTrack === undefined) {
            return
          }

          // 選択範囲を確定して選択範囲内のノートを選択状態にする
          // Confirm the selection and select the notes in the selection state
          pianoRollStore.selectedNoteIds = eventsInSelection(
            selectedTrack.events,
            selection,
          ).map((e) => e.id)

          pianoRollStore.selection = null
        },
      })
    },
  }
}
