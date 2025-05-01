import styled from "@emotion/styled"
import { FC, useCallback } from "react"
import { useSetTrackPan } from "../../actions"
import { usePianoRoll } from "../../hooks/usePianoRoll"
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

const PAN_CENTER = 64

export const PanSlider: FC = () => {
  const { currentPan, selectedTrackId: trackId } = usePianoRoll()
  const setTrackPan = useSetTrackPan()
  const onChange = useCallback(
    (value: number) => setTrackPan(trackId, value),
    [setTrackPan, trackId],
  )
  const pan = currentPan ?? PAN_CENTER

  return (
    <Container>
      <Label>
        <Localized name="pan" />
      </Label>
      <Slider
        value={pan}
        onChange={(value) => onChange(value as number)}
        onDoubleClick={() => onChange(PAN_CENTER)}
        min={0}
        max={127}
        defaultValue={PAN_CENTER}
        minStepsBetweenThumbs={1}
        marks={[PAN_CENTER]}
      ></Slider>
    </Container>
  )
}
