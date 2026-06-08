import { useCallback, useMemo } from "react"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { useChangeToolGesture } from "./useChangeToolGesture"
import { useDragScrollGesture } from "./useDragScrollGesture"
import { usePencilGesture } from "./usePencilGesture"
import { useSelectionGesture } from "./useSelectionGesture"

export const useNoteMouseGesture = (): MouseDownHandler<
  [],
  React.MouseEvent
> => {
  const { mouseMode } = usePianoRoll()
  const pencilGesture = usePencilGesture()
  const selectionGesture = useSelectionGesture()
  const currentGesture = useMemo(() => {
    switch (mouseMode) {
      case "pencil":
        return pencilGesture
      case "selection":
        return selectionGesture
    }
  }, [mouseMode, pencilGesture, selectionGesture])
  const dragScrollAction = useDragScrollGesture()
  const changeToolAction = useChangeToolGesture()

  const getGestureForMouseDown = useCallback(
    (e: MouseEvent) => {
      // Common Action

      // wheel drag to start scrolling
      if (e.button === 1) {
        return dragScrollAction
      }

      // Right Double-click
      if (e.button === 2 && e.detail % 2 === 0) {
        return changeToolAction
      }

      return currentGesture
    },
    [changeToolAction, currentGesture, dragScrollAction],
  )

  return useCallback(
    (ev) => {
      const e = ev.nativeEvent
      getGestureForMouseDown(e)(e)
    },
    [getGestureForMouseDown],
  )
}
