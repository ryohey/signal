import { MouseGesture } from "../../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export const useChangeToolGesture = (): MouseGesture => {
  const { toggleTool } = usePianoRoll()
  return {
    onMouseDown() {
      toggleTool()
    },
  }
}
