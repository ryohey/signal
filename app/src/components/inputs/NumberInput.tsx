import { FC } from "react"
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
  const handleValueChange: NumericFormatProps["onValueChange"] = ({
    floatValue,
  }) => {
    if (floatValue !== undefined && floatValue !== null) {
      onChange(floatValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onEnter?.()
    }
  }

  // Type assertion needed due to React 19's stricter type checking causing
  // "union type too complex" error with NumericFormat's complex prop types
  const NumericFormatTyped = NumericFormat as any

  return (
    <NumericFormatTyped
      value={value}
      onValueChange={handleValueChange}
      fixedDecimalScale
      allowNegative={allowNegative}
      style={style}
      className={className}
      onKeyDown={handleKeyDown}
      min={min}
      max={max}
      step={step}
      id={id}
    />
  )
}
