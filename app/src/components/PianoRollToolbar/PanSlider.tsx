import styled from "@emotion/styled"
import { FC } from "react"
import { usePanSlider } from "../../hooks/usePanSlider"
import { Localized } from "../../localize/useLocalization"
import { Slider } from "../ui/Slider"

const Container = styled.div`
  display: flex;
  flex-grow: 1;
  max-width: 8rem;
  min-width: 5rem;
  margin-left: 1rem;
  margin-right: 2rem;
`

const Label = styled.div`
  display: flex;
  align-items: center;
  margin-right: 0.5rem;
  color: var(--color-text-secondary);
`

export const PanSlider: FC = () => {
  const { value, setValue, defaultValue } = usePanSlider()

  return (
    <Container>
      <Label>
        <Localized name="pan" />
      </Label>
      <Slider
        value={value}
        onChange={(value) => setValue(value as number)}
        onDoubleClick={() => setValue(defaultValue)}
        min={0}
        max={127}
        defaultValue={defaultValue}
        minStepsBetweenThumbs={1}
        marks={[defaultValue]}
      ></Slider>
    </Container>
  )
}
