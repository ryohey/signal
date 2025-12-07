import { type CSSProperties, useMemo } from "react"

// div props and styles for positioned elements
export type PositionedProps = React.HTMLAttributes<HTMLDivElement> & {
  top?: number
  left?: number
  right?: number
  bottom?: number
  width?: number
  height?: number
}

export const Positioned: React.FC<PositionedProps> = ({
  top,
  left,
  right,
  bottom,
  width,
  height,
  style,
  children,
  ...props
}) => {
  const computedStyle: CSSProperties = useMemo(
    () => ({
      position: "absolute",
      top,
      left,
      right,
      bottom,
      width,
      height,
      ...style,
    }),
    [top, left, right, bottom, width, height, style]
  )

  return (
    <div {...props} style={computedStyle}>
      {children}
    </div>
  )
}
