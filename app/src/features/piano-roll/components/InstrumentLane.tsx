import styled from "@emotion/styled"
import { Positioned } from "@signal-app/ui"
import { type FC, useMemo } from "react"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { useProgramChangeEvents } from "../hooks/useEventView"
import { InstrumentMark } from "./InstrumentMark"

export interface InstrumentLaneProps {
  width: number
}

const Container = styled.div`
  position: absolute;
  top: 0.25rem;
  left: 0;
`

export const InstrumentLane: FC<InstrumentLaneProps> = ({ width }) => {
  const { scrollLeft, transform } = useTickScroll()
  const programChangeEvents = useProgramChangeEvents()

  const style = useMemo(
    () => ({
      width,
    }),
    [width],
  )

  return (
    <Container style={style}>
      <Positioned left={-scrollLeft}>
        {programChangeEvents.map((e) => (
          <InstrumentMark key={e.id} event={e} transform={transform} />
        ))}
      </Positioned>
    </Container>
  )
}
