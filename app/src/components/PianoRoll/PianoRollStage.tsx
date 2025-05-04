import { useTheme } from "@emotion/react"
import styled from "@emotion/styled"
import { FC } from "react"
import { Layout } from "../../Constants"
import { useKeyScroll } from "../../hooks/useKeyScroll"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import CanvasPianoRuler from "./CanvasPianoRuler"
import { PianoKeys } from "./PianoKeys"
import { PianoRollCanvas } from "./PianoRollCanvas/PianoRollCanvas"

export interface PianoRollStageProps {
  width: number
  height: number
}

const Container = styled.div``

const ContentPosition = styled.div`
  position: absolute;
  left: var(--size-key-width);
`

const RulerPosition = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  padding-left: var(--size-key-width);
  height: var(--size-ruler-height);
`

const PianoKeyPosition = styled.div`
  position: absolute;
  left: 0;
  top: 0;
`

export const PianoRollStage: FC<PianoRollStageProps> = ({ width, height }) => {
  const { rulerStore } = usePianoRoll()
  const { scrollTop } = useKeyScroll()
  const theme = useTheme()

  return (
    <Container>
      <ContentPosition style={{ top: Layout.rulerHeight }}>
        <PianoRollCanvas width={width} height={height - Layout.rulerHeight} />
      </ContentPosition>
      <PianoKeyPosition style={{ top: -scrollTop + Layout.rulerHeight }}>
        <PianoKeys />
      </PianoKeyPosition>
      <RulerPosition
        style={{
          background: theme.backgroundColor,
          borderBottom: `1px solid ${theme.dividerColor}`,
        }}
      >
        <CanvasPianoRuler rulerStore={rulerStore} />
      </RulerPosition>
    </Container>
  )
}
