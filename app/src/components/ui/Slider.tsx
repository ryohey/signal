import styled from "@emotion/styled"
import {
  type SliderProps as Props,
  Range,
  Root,
  Thumb,
  Track,
} from "@radix-ui/react-slider"
import type { FC } from "react"

export type SliderProps = Omit<
  Props,
  "value" | "onValueChange" | "onChange" | "defaultValue"
> & {
  value: number
  defaultValue?: number
  onChange: (value: number) => void
  marks?: number[]
}

const StyledRoot = styled(Root)`
  position: relative;
  display: flex;
  flex-grow: 1;
  align-items: center;
  user-select: none;
  touch-action: none;
  height: 2rem;
`

const StyledTrack = styled(Track)`
  background-color: var(--color-text-tertiary);
  position: relative;
  flex-grow: 1;
  border-radius: 9999px;
  height: 0.1rem;
`

const StyledRange = styled(Range)`
  position: absolute;
  background-color: var(--color-text);
  border-radius: 9999px;
  height: 100%;
`

const StyledThumb = styled(Thumb)`
  display: block;
  width: 0.75rem;
  height: 0.75rem;
  background-color: var(--color-text);
  box-shadow: 0 0.1rem 1rem var(--color-shadow);
  border-radius: 999px;

  &:hover {
    background-color: var(--color-text-secondary);
  }

  &:focus {
    outline: none;
  }
`

const Mark = styled.div`
  width: 0.1rem;
  height: 100%;
  position: absolute;
  background-color: var(--color-text);
`

export const Slider: FC<SliderProps> = ({
  value,
  onChange,
  defaultValue,
  marks,
  ...props
}) => (
  <StyledRoot
    value={[value]}
    defaultValue={defaultValue !== undefined ? [defaultValue] : undefined}
    onValueChange={(value) => onChange(value[0])}
    {...props}
  >
    <StyledTrack>
      <StyledRange />
      {marks?.map((value, index) => (
        <Mark
          key={index}
          style={{
            left: `${(value / (props.max ?? 100)) * 100}%`,
          }}
        />
      ))}
    </StyledTrack>
    <StyledThumb tabIndex={-1} />
  </StyledRoot>
)
