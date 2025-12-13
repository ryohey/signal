import type { Point } from "./Point"

export interface Rect extends Point {
  readonly width: number
  readonly height: number
}

export namespace Rect {
  export function containsPoint(rect: Rect, point: Point) {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    )
  }

  export function right(rect: Rect) {
    return rect.x + rect.width
  }

  export function bottom(rect: Rect) {
    return rect.y + rect.height
  }

  export function intersects(rectA: Rect, rectB: Rect) {
    return (
      right(rectA) > rectB.x &&
      right(rectB) > rectA.x &&
      bottom(rectA) > rectB.y &&
      bottom(rectB) > rectA.y
    )
  }

  export function containsRect(rectA: Rect, rectB: Rect) {
    return (
      Rect.containsPoint(rectA, rectB) && Rect.containsPoint(rectA, br(rectB))
    )
  }

  export function br(rect: Rect): Point {
    return {
      x: right(rect),
      y: bottom(rect),
    }
  }

  export function fromPoints(pointA: Point, pointB: Point): Rect {
    const x1 = Math.min(pointA.x, pointB.x)
    const x2 = Math.max(pointA.x, pointB.x)
    const y1 = Math.min(pointA.y, pointB.y)
    const y2 = Math.max(pointA.y, pointB.y)

    return {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
    }
  }

  export function fromPointWithSize(point: Point, size: number): Rect {
    return {
      x: point.x - size / 2,
      y: point.y - size / 2,
      width: size,
      height: size,
    }
  }

  export function scale(rect: Rect, scaleX: number, scaleY: number): Rect {
    return {
      x: rect.x * scaleX,
      y: rect.y * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
    }
  }

  export const zero: Rect = { x: 0, y: 0, width: 0, height: 0 }

  export function move(rect: Rect, p: Point): Rect {
    return {
      x: rect.x + p.x,
      y: rect.y + p.y,
      width: rect.width,
      height: rect.height,
    }
  }
}
