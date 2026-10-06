import { Point } from "@signal-app/geometry"
import { useCallback } from "react"
import type { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { useHistory } from "../../../hooks/useHistory"
import { useControlEditor } from "../hooks/useControlEditor"
import { useControlPane } from "../hooks/useControlPane"

interface Vertex extends Point {
  id: number
}

const distanceToSegment = (p: Point, a: Point, b: Point): number => {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const lengthSq = abx * abx + aby * aby
  const t =
    lengthSq === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSq),
        )
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby))
}

export const findVertexAt = (
  vertices: readonly Vertex[],
  point: Point,
  radius: number,
): Vertex | undefined =>
  vertices.find((v) => Math.hypot(v.x - point.x, v.y - point.y) <= radius)

// Erases individual vertices under the cursor. Dragging erases every vertex
// the pointer sweeps over, as one undo step.
export const useEraseGesture = (): MouseDownHandler<
  [Point, readonly Vertex[], number]
> => {
  const { pushHistory } = useHistory()
  const { setSelectedEventIds } = useControlPane()
  const controlEditor = useControlEditor()

  return useCallback(
    (e, startPoint, vertices, radius) => {
      const erased = new Set<number>()

      const erase = (from: Point, to: Point) => {
        const hit = vertices
          .filter(
            (v) =>
              !erased.has(v.id) && distanceToSegment(v, from, to) <= radius,
          )
          .map((v) => v.id)
        if (hit.length === 0) {
          return
        }
        if (erased.size === 0) {
          pushHistory()
          setSelectedEventIds([])
        }
        hit.forEach((id) => erased.add(id))
        controlEditor.removeItems(hit)
      }

      let last = startPoint
      erase(startPoint, startPoint)

      observeDrag2(e, {
        onMouseMove: (_e, delta) => {
          const local = Point.add(startPoint, delta)
          erase(last, local)
          last = local
        },
      })
    },
    [controlEditor, pushHistory, setSelectedEventIds],
  )
}
