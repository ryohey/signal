import { CSSProperties, useMemo } from "react"
import { type Point } from "../../../entities/geometry/Point"

export interface DragPreviewProps {
  start: Point
  end: Point
  scrollLeft: number
  width: number
  height: number
  color: string
  easing: (t: number) => number
}

const NUM_SAMPLES = 32

export const DragPreview = ({
  start,
  end,
  scrollLeft,
  width,
  height,
  color,
  easing,
}: DragPreviewProps) => {
  const points = useMemo(() => {
    const sx = start.x
    const sy = start.y
    const ex = end.x
    const ey = end.y
    return Array.from({ length: NUM_SAMPLES + 1 }, (_, i) => {
      const t = i / NUM_SAMPLES
      const x = sx + t * (ex - sx)
      const y = sy + easing(t) * (ey - sy)
      return `${x},${y}`
    }).join(" ")
  }, [start.x, start.y, end.x, end.y, easing])

  const style: CSSProperties = useMemo(
    () => ({
      position: "absolute",
      top: 0,
      left: 0,
      pointerEvents: "none",
    }),
    [],
  )

  return (
    <svg style={style} width={width} height={height} aria-hidden="true">
      <g transform={`translate(${-scrollLeft}, 0)`}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="6 3"
        />
        <circle cx={start.x} cy={start.y} r={4} fill={color} />
        <circle cx={end.x} cy={end.y} r={4} fill={color} />
      </g>
    </svg>
  )
}
