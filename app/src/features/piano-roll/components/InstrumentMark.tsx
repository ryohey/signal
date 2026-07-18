import styled from "@emotion/styled"
import type { TrackEventOf } from "@signal-app/core"
import type { ProgramChangeEvent } from "midifile-ts"
import { type FC, useCallback, useMemo, useState } from "react"
import { InstrumentBrowser } from "../../../components/InstrumentBrowser/InstrumentBrowser"
import type { TickTransform } from "../../../entities/transform/TickTransform"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useTrack } from "../../../hooks/useTrack"
import {
  InstrumentEmoji,
  InstrumentName,
} from "../../track-list/components/InstrumentName"
import { usePianoRoll } from "../hooks/usePianoRoll"

const Container = styled.div`
  position: absolute;
  white-space: nowrap;
  background: var(--color-theme);
  color: var(--color-text);
  padding: 0.2em 0.5em;
  border-radius: 0 4px 4px 0;
  margin: 0.2em 0 0 0;
  box-shadow: 1px 1px 3px 0 rgba(0, 0, 0, 0.02);
  transition: opacity 0.1s ease;
  opacity: 0.5;
  max-width: 7rem;
  overflow: hidden;
  cursor: grab;

  &:hover {
    opacity: 1;
    max-width: none;
    overflow: visible;
  }
`

export const InstrumentMark: FC<{
  event: TrackEventOf<ProgramChangeEvent>
  transform: TickTransform
}> = ({ event, transform }) => {
  const style = useMemo(() => {
    return {
      left: transform.getX(event.tick),
    }
  }, [transform, event.tick])
  const [isOpenInstrumentBrowser, setIsOpenInstrumentBrowser] = useState(false)
  const { selectedTrackId } = usePianoRoll()
  const { removeEvent, updateEvent } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()
  const { quantizeRound } = useQuantizer()

  const handleDoubleClick = useCallback(() => {
    setIsOpenInstrumentBrowser(true)
  }, [])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      removeEvent(event.id)
    },
    [event.id, removeEvent],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) {
        return
      }
      e.stopPropagation()

      const startTick = event.tick
      let isChanged = false

      observeDrag2(e.nativeEvent, {
        onMouseMove: (_e, delta) => {
          if (!isChanged) {
            isChanged = true
            pushHistory()
          }
          const deltaTick = transform.getTick(delta.x)
          const newTick = Math.max(0, quantizeRound(startTick + deltaTick))
          updateEvent(event.id, { tick: newTick })
        },
      })
    },
    [event.id, event.tick, transform, updateEvent, pushHistory, quantizeRound],
  )

  return (
    <>
      <Container
        style={style}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <InstrumentEmoji programNumber={event.value} isRhythmTrack={false} />{" "}
        <InstrumentName programNumber={event.value} isRhythmTrack={false} />
      </Container>
      <InstrumentBrowser
        isOpen={isOpenInstrumentBrowser}
        onOpenChange={setIsOpenInstrumentBrowser}
        trackId={selectedTrackId}
        targetEvent={event}
      />
    </>
  )
}
