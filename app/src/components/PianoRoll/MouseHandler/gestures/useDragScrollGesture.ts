import { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useStores } from "../../../../hooks/useStores"

export const useDragScrollGesture = (): MouseGesture => {
  const { pianoRollStore } = useStores()
  return {
    onMouseDown() {
      observeDrag({
        onMouseMove: (e: MouseEvent) => {
          pianoRollStore.scrollBy(e.movementX, e.movementY)
          pianoRollStore.autoScroll = false
        },
      })
    },
  }
}
