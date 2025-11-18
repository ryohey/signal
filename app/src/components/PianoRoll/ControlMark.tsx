import styled from "@emotion/styled"
import { TrackEventRequired } from "@signal-app/core"
import { ControllerEvent, ProgramChangeEvent } from "midifile-ts"
import { FC } from "react"
import { TickTransform } from "../../entities/transform/TickTransform"
import { controllerTypeString as CCNames } from "../../helpers/noteNumberString"

export type DisplayEvent = TrackEventRequired &
  (ControllerEvent | ProgramChangeEvent)

function displayControlName(e: DisplayEvent): string {
  switch (e.subtype) {
    case "controller": {
      const name = CCNames(e.controllerType)
      return name || "Control"
    }
    case "programChange":
      return "Program Change"
    default:
      return "Control"
  }
}

interface ControlMarkProps {
  group: DisplayEvent[]
  transform: TickTransform
  onDoubleClick: () => void
}

const Container = styled.div`
  position: absolute;
  white-space: nowrap;
  opacity: 0.8;
  background: var(--color-theme);
  color: var(--color-background);
  padding: 0.1em 0.3em;
  border-radius: 0 0.3em 0.3em 0;
  margin: 0.2em 0 0 0;
  box-shadow: 1px 1px 3px 0 rgba(0, 0, 0, 0.02);

  &:hover {
    opacity: 1;
  }
`

export const ControlMark: FC<ControlMarkProps> = ({
  group,
  transform,
  onDoubleClick,
}) => {
  const event = group[0]
  return (
    <Container
      style={{ left: transform.getX(event.tick) }}
      onDoubleClick={onDoubleClick}
    >
      {displayControlName(event)}
      {group.length > 1 ? ` +${group.length}` : ""}
    </Container>
  )
}
