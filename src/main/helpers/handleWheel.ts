import { clamp } from "lodash"
import { isTouchPadEvent } from "./touchpad"

export type WheelAction =
  | {
      type: "scaleY"
      delta: number
    }
  | {
      type: "scaleX"
      delta: number
    }
  | {
      type: "scroll"
      x: number
      y: number
    }

export const handleWheel = (
  e: React.WheelEvent,
  scrollRate: number
): WheelAction => {
  if (e.shiftKey && (e.altKey || e.ctrlKey)) {
    // vertical zoom
    let scaleYDelta = isTouchPadEvent(e.nativeEvent)
      ? 0.02 * e.deltaY
      : 0.01 * e.deltaX
    scaleYDelta = clamp(scaleYDelta, -0.15, 0.15) // prevent acceleration to zoom too fast
    return {
      type: "scaleY",
      delta: scaleYDelta,
    }
  } else if (e.altKey || e.ctrlKey) {
    // horizontal zoom
    const scaleFactor = isTouchPadEvent(e.nativeEvent) ? 0.01 : -0.01
    const scaleXDelta = clamp(e.deltaY * scaleFactor, -0.15, 0.15) // prevent acceleration to zoom too fast
    return {
      type: "scaleX",
      delta: scaleXDelta,
    }
  } else if (isTouchPadEvent(e.nativeEvent)) {
    // touch pad scrolling
    return {
      type: "scroll",
      x: -e.deltaX,
      y: -e.deltaY,
    }
  } else {
    // scrolling

    // treat horizontal and vertical scroll as one to standardize the platform differences
    // in macOS, shift + scroll is horizontal scroll while in Windows, it is vertical scroll
    const delta = (e.deltaX + e.deltaY) * scrollRate
    // scroll horizontally if shift key is pressed
    if (e.shiftKey) {
      return {
        type: "scroll",
        x: -delta,
        y: 0,
      }
    } else {
      return {
        type: "scroll",
        x: 0,
        y: -delta,
      }
    }
  }
}
