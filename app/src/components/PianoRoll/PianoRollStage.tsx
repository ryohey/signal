import styled from "@emotion/styled"
import { FC } from "react"
import { Layout } from "../../Constants"
import { useKeyScroll } from "../../hooks/useKeyScroll"
import { useSettings } from "../../hooks/useSettings"
import { Positioned } from "../ui/Positioned"
import CanvasPianoRuler from "./CanvasPianoRuler"
import { PianoKeys } from "./PianoKeys"
import { PianoRollCanvas } from "./PianoRollCanvas/PianoRollCanvas"

export interface PianoRollStageProps {
  width: number
  height: number
  keyWidth: number
}

const Container = styled.div``

const HorizontalRulerPosition = styled(Positioned)`
  height: var(--size-ruler-height);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-divider);
`

const LeftTopSpace = styled(HorizontalRulerPosition)``

const VerticalRulerPosition = styled(Positioned)`
  width: var(--size-ruler-height);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-divider);
`

const LeftBottomSpace = styled(HorizontalRulerPosition)``

export const PianoRollStage: FC<PianoRollStageProps> = ({
  width,
  height,
  keyWidth,
}) => {
  const { verticalPiano } = useSettings()
  const { scrollTop } = useKeyScroll()

  if (verticalPiano) {
    // Vertical piano mode: piano keys on bottom, piano roll from bottom to top with ruler on left
    return (
      <Container>
        <Positioned left={Layout.rulerHeight}>
          <PianoRollCanvas width={width - Layout.rulerHeight} height={height} />
        </Positioned>
        <Positioned bottom={0} right={-scrollTop}>
          <PianoKeys width={keyWidth} />
        </Positioned>
        <LeftBottomSpace height={keyWidth} bottom={0} />
        <VerticalRulerPosition top={0} left={0}>
          <CanvasPianoRuler />
        </VerticalRulerPosition>
      </Container>
    )
  }

  // Horizontal piano mode: piano keys on left, piano roll from left to right with ruler on top
  return (
    <Container>
      <Positioned top={Layout.rulerHeight} left={keyWidth}>
        <PianoRollCanvas width={width} height={height - Layout.rulerHeight} />
      </Positioned>
      <Positioned top={-scrollTop + Layout.rulerHeight}>
        <PianoKeys width={keyWidth} />
      </Positioned>
      <LeftTopSpace width={keyWidth} />
      <HorizontalRulerPosition left={keyWidth}>
        <CanvasPianoRuler />
      </HorizontalRulerPosition>
    </Container>
  )
}
