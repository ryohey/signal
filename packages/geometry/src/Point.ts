export interface Point {
  readonly x: number
  readonly y: number
}

export namespace Point {
  export function sub(v1: Point, v2: Point) {
    return {
      x: v1.x - v2.x,
      y: v1.y - v2.y,
    }
  }

  export function add(v1: Point, v2: Point) {
    return {
      x: v1.x + v2.x,
      y: v1.y + v2.y,
    }
  }

  export const zero = { x: 0, y: 0 }
}
