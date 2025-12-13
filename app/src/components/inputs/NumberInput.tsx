import { FC, forwardRef } from "react"
import { NumericFormat, NumericFormatProps } from "react-number-format"

export interface NumberInputProps {
  value: number
  min?: number
  max?: number
  step?: number
  id?: string
  allowNegative?: boolean
  onChange: (value: number) => void
  onEnter?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      min,
      max,
      step,
      id,
      allowNegative = false,
      onChange,
      onEnter,
      onBlur,
      style,
      className,
    },
    ref,
  ) => {
    const handleValueChange: NumericFormatProps["onValueChange"] = ({ floatValue }) => {
      if (floatValue !== undefined && floatValue !== null) {
        onChange(floatValue)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onEnter?.()
        // Blur the input when Enter is pressed
        if (ref && typeof ref !== "function" && ref.current) {
          ref.current.blur()
        } else if (e.currentTarget) {
          e.currentTarget.blur()
        }
      }
    }

    // Type assertion needed due to React 19's stricter type checking causing
    // "union type too complex" error with NumericFormat's complex prop types
    const NumericFormatTyped = NumericFormat as any

    return (
      <NumericFormatTyped
        ref={ref}
        value={value}
        onValueChange={handleValueChange}
        fixedDecimalScale
        allowNegative={allowNegative}
        style={style}
        className={className}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        min={min}
        max={max}
        step={step}
        id={id}
      />
    )
  },
)

NumberInput.displayName = "NumberInput"
