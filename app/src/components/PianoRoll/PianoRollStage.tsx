import styled from "@emotion/styled"
import { FC } from "react"
import { Layout } from "../../Constants"
import { useKeyScroll } from "../../hooks/useKeyScroll"
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

const RulerPosition = styled(Positioned)`
  height: var(--size-ruler-height);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-divider);
`

const LeftTopSpace = styled(RulerPosition)``

export const PianoRollStage: FC<PianoRollStageProps> = ({
  width,
  height,
  keyWidth,
}) => {
  const { scrollTop } = useKeyScroll()

  return (
    <Container>
      <Positioned top={Layout.rulerHeight} left={keyWidth}>
        <PianoRollCanvas
          width={width}
          height={height - Layout.rulerHeight}
          keyWidth={keyWidth}
        />
      </Positioned>
      <Positioned top={-scrollTop + Layout.rulerHeight}>
        <PianoKeys width={keyWidth} />
      </Positioned>
      <LeftTopSpace width={keyWidth} />
      <RulerPosition left={keyWidth}>
        <CanvasPianoRuler />
      </RulerPosition>
    </Container>
  )
}
