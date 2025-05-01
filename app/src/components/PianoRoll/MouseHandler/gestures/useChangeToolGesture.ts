import { MouseGesture } from "../../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export const useChangeToolGesture = (): MouseGesture => {
  const { toggleTool, setNotesCursor } = usePianoRoll()
  return {
    onMouseDown() {
      toggleTool()
      setNotesCursor("crosshair")
    },
  }
}
