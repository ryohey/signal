import { MouseDownHandler } from "../../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export const useChangeToolGesture = (): MouseDownHandler => {
  const { toggleTool } = usePianoRoll()
  return toggleTool
}
