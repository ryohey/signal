import { Point } from "../entities/geometry/Point"
import { getClientPos } from "./mouseEvent"

export interface DragHandler {
  onMouseMove?: (e: MouseEvent) => void
  onMouseUp?: (e: MouseEvent) => void
  onClick?: (e: MouseEvent) => void
}

export const observeDrag = ({
  onMouseMove,
  onMouseUp,
  onClick,
}: DragHandler) => {
  let isMoved = false

  const onGlobalMouseMove = (e: MouseEvent) => {
    isMoved = true
    onMouseMove?.(e)
  }

  const onGlobalMouseUp = (e: MouseEvent) => {
    onMouseUp?.(e)

    if (!isMoved) {
      onClick?.(e)
    }

    document.removeEventListener("mousemove", onGlobalMouseMove)
    document.removeEventListener("mouseup", onGlobalMouseUp)
  }

  document.addEventListener("mousemove", onGlobalMouseMove)
  document.addEventListener("mouseup", onGlobalMouseUp)
}

export interface DragHandler2 {
  onMouseMove?: (e: MouseEvent, delta: Point) => void
  onMouseUp?: (e: MouseEvent) => void
  onClick?: (e: MouseEvent) => void
}

export const observeDrag2 = (
  e: MouseEvent,
  { onMouseMove, onMouseUp, onClick }: DragHandler2,
) => {
  let isMoved = false
  const startClientPos = getClientPos(e)

  const onGlobalMouseMove = (e: MouseEvent) => {
    isMoved = true
    const clientPos = getClientPos(e)
    const delta = Point.sub(clientPos, startClientPos)
    onMouseMove?.(e, delta)
  }

  const onGlobalMouseUp = (e: MouseEvent) => {
    onMouseUp?.(e)

    if (!isMoved) {
      onClick?.(e)
    }

    document.removeEventListener("mousemove", onGlobalMouseMove)
    document.removeEventListener("mouseup", onGlobalMouseUp)
  }

  document.addEventListener("mousemove", onGlobalMouseMove)
  document.addEventListener("mouseup", onGlobalMouseUp)
}
