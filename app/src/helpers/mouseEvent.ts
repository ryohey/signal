import { Point } from "@signal-app/geometry"

export const getClientPos = (e: MouseEvent): Point => ({
  x: e.clientX,
  y: e.clientY,
})
