import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useStores } from "../../../../hooks/useStores"

export const useChangeToolGesture = (): MouseGesture => {
  const { pianoRollStore } = useStores()
  return {
    onMouseDown() {
      pianoRollStore.toggleTool()
      pianoRollStore.notesCursor = "crosshair"
    },
  }
}
