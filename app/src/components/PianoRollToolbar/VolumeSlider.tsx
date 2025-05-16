import styled from "@emotion/styled"
import VolumeUp from "mdi-react/VolumeHighIcon"
import { FC } from "react"
import { useVolumeSlider } from "../../hooks/useVolumeSlider"
import { Slider } from "../ui/Slider"

const Container = styled.div`
  display: flex;
  flex-grow: 1;
  max-width: 8rem;
  min-width: 5rem;
  margin-left: 1rem;
  margin-right: 1rem;
  align-items: center;
`

const VolumeIcon = styled(VolumeUp)`
  width: 1.3rem;
  height: 2rem;
  color: var(--color-text-secondary);
  margin-right: 0.5rem;
`

export const VolumeSlider: FC = () => {
  const { value, setValue, onPointerDown, onPointerUp } = useVolumeSlider()

  return (
    <Container>
      <VolumeIcon />
      <Slider
        value={value}
        onChange={setValue}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        max={127}
        minStepsBetweenThumbs={1}
      />
    </Container>
  )
}
