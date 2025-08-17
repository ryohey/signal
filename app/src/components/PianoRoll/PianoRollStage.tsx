import { useTheme } from "@emotion/react"
import styled from "@emotion/styled"
import { FC } from "react"
import { Layout } from "../../Constants"
import { useKeyScroll } from "../../hooks/useKeyScroll"
import CanvasPianoRuler from "./CanvasPianoRuler"
import { PianoKeys } from "./PianoKeys"
import { PianoRollCanvas } from "./PianoRollCanvas/PianoRollCanvas"

export interface PianoRollStageProps {
  width: number
  height: number
  keyWidth: number
}

const Container = styled.div``

const ContentPosition = styled.div`
  position: absolute;
`

const RulerPosition = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: var(--size-ruler-height);
`

const PianoKeyPosition = styled.div`
  position: absolute;
  left: 0;
  top: 0;
`

export const PianoRollStage: FC<PianoRollStageProps> = ({
  width,
  height,
  keyWidth,
}) => {
  const { scrollTop } = useKeyScroll()
  const theme = useTheme()

  return (
    <Container>
      <ContentPosition style={{ top: Layout.rulerHeight, left: keyWidth }}>
        <PianoRollCanvas width={width} height={height - Layout.rulerHeight} />
      </ContentPosition>
      <PianoKeyPosition style={{ top: -scrollTop + Layout.rulerHeight }}>
        <PianoKeys width={keyWidth} />
      </PianoKeyPosition>
      <RulerPosition
        style={{
          background: theme.backgroundColor,
          borderBottom: `1px solid ${theme.dividerColor}`,
          paddingLeft: keyWidth,
        }}
      >
        <CanvasPianoRuler />
      </RulerPosition>
    </Container>
  )
}
