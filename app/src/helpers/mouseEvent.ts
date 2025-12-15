import { Point } from "../entities/geometry/Point"

export const getClientPos = (e: MouseEvent): Point => ({
  x: e.clientX,
  y: e.clientY,
})
