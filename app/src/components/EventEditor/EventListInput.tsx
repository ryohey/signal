import styled from "@emotion/styled"
import { type FC, useCallback, useState } from "react"
import type { EventInputProp } from "./EventController"

type EventListInputProps = EventInputProp & {
  type: "number" | "text"
  onChange: (value: string) => void
}

export const StyledInput = styled.input`
  width: 100%;
  display: block;
  background: transparent;
  border: none;
  color: inherit;
  -webkit-appearance: none;
  font-size: inherit;
  font-family: var(--font-mono);
  outline: none;

  /* Hide spin button on Firefox */
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`

export const EventListInput: FC<EventListInputProps> = ({
  value,
  type,
  onChange,
}) => {
  const [isFocus, setFocus] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const sendChange = useCallback(() => {
    onChange(inputValue)
  }, [inputValue, onChange])

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === "Enter") {
        const inputs = Array.from(
          e.currentTarget?.parentElement?.parentElement?.parentElement?.querySelectorAll(
            "input"
          ) ?? []
        ).filter((e) => !e.disabled)
        const index = inputs.indexOf(e.currentTarget)
        const elm = inputs[index + 1]
        elm?.focus()
        elm?.select()
        e.preventDefault()
      }

      if (e.key === "Escape") {
        // TODO: Reset inputValue to value
        e.currentTarget.blur()
      }

      if (e.key === "Enter" || e.key === "Tab") {
        sendChange()
      }
    },
    [sendChange]
  )

  return (
    <StyledInput
      type={type}
      value={isFocus ? inputValue : value}
      onFocus={useCallback(() => {
        setFocus(true)
        setInputValue(value)
      }, [value])}
      onBlur={useCallback(() => {
        setFocus(false)
        sendChange()
      }, [sendChange])}
      onChange={useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          if (isFocus) {
            setInputValue(e.target.value)
          }
        },
        [isFocus]
      )}
      disabled={value === null}
      onKeyDown={onKeyDown}
    />
  )
}
