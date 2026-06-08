import styled from "@emotion/styled"
import { isProgramChangeEvent } from "@signal-app/core"
import { type FC, useMemo } from "react"
import { Positioned } from "../../../components/ui/Positioned"
import { useEventView } from "../../../hooks/useEventView"
import { useTickScroll } from "../../../hooks/useTickScroll"
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
  const events = useEventView()
  const { scrollLeft, transform } = useTickScroll()

  const programChangeEvents = events.filter(isProgramChangeEvent)

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
