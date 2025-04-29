import { useState } from "react"
import { MouseGesture } from "../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useChangeToolGesture } from "./gestures/useChangeToolGesture"
import { useDragScrollGesture } from "./gestures/useDragScrollGesture"
import { usePencilGesture } from "./usePencilGesture"
import { useSelectionGesture } from "./useSelectionGesture"

export interface CursorProvider {
  getCursor(e: MouseEvent): string
}

export const useNoteMouseGesture = (): MouseGesture<[], React.MouseEvent> => {
  const { mouseMode, setNotesCursor } = usePianoRoll()
  const [isMouseDown, setMouseDown] = useState(false)
  const pencilGesture = usePencilGesture()
  const selectionGesture = useSelectionGesture()
  const currentGesture = (() => {
    switch (mouseMode) {
      case "pencil":
        return pencilGesture
      case "selection":
        return selectionGesture
    }
  })()
  const dragScrollAction = useDragScrollGesture()
  const changeToolAction = useChangeToolGesture()

  function getGestureForMouseDown(e: MouseEvent) {
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
  }

  return {
    onMouseDown(ev) {
      const e = ev.nativeEvent
      setMouseDown(true)
      getGestureForMouseDown(e).onMouseDown(e)
    },

    onMouseMove(ev) {
      const e = ev.nativeEvent
      if (!isMouseDown) {
        const cursor = currentGesture.getCursor(e)
        setNotesCursor(cursor)
      }
    },

    onMouseUp() {
      setMouseDown(false)
    },
  }
}
