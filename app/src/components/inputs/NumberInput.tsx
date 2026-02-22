import { FC } from "react"
import { NumericFormat } from "react-number-format"

export interface NumberInputProps {
  value: number
  min?: number
  max?: number
  step?: number
  id?: string
  allowNegative?: boolean
  onChange: (value: number) => void
  onEnter?: () => void
  style?: React.CSSProperties
  className?: string
}

export const NumberInput: FC<NumberInputProps> = ({
  value,
  min,
  max,
  step,
  id,
  allowNegative = false,
  onChange,
  onEnter,
  style,
  className,
}) => {
  return (
    <NumericFormat
      // @ts-expect-error - React 19 type compatibility issue with react-number-format
      value={value}
      onValueChange={({ floatValue }) => {
        if (floatValue !== undefined) {
          onChange(floatValue)
        }
      }}
      fixedDecimalScale
      allowNegative={allowNegative}
      style={style}
      className={className}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onEnter?.()
        }
        if (e.key === "Escape") {
          // blur on escape to trigger onBlur validation
          ;(e.target as HTMLElement).blur()
        }
      }}
      min={min}
      max={max}
      step={step}
      id={id}
    />
  )
}
