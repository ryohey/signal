import {
  addEvent,
  getProgramNumberEvent,
  isProgramChangeEvent,
  programChangeMidiEvent,
  TrackEventOf,
  TrackId,
  updateEvent,
} from "@signal-app/core"
import { ProgramChangeEvent } from "midifile-ts"
import { useCallback } from "react"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useTrack } from "../../../hooks/useTrack"

export const useSetTrackInstrument = (trackId: TrackId, eventId?: number) => {
  const { sendEvent, position } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel, getEvents } = useTrack(trackId)
  const mutate = useMutateTrack(trackId)

  return useCallback(
    (programNumber: number) => {
      pushHistory()

      let targetEventId: number | undefined = eventId

      if (eventId === undefined) {
        // get last program change event before position
        const programNumberEvent = mutate(
          (events) =>
            getProgramNumberEvent(position)(events.getArray()) ??
            addEvent<TrackEventOf<ProgramChangeEvent>>({
              ...programChangeMidiEvent(0, 0, programNumber),
              tick: 0,
            })(events),
        )
        targetEventId = programNumberEvent?.id
      }

      if (targetEventId === undefined) {
        return
      }

      const targetEvent = mutate(
        updateEvent<TrackEventOf<ProgramChangeEvent>>(targetEventId, {
          value: programNumber,
        }),
      )

      if (!targetEvent) {
        return
      }

      const tick = targetEvent.tick

      // If the player position is after the insertion position and there are no other program change events, reflect immediately
      if (channel !== undefined && position >= tick) {
        const hasOtherProgramChangeEvents = getEvents()
          .filter(isProgramChangeEvent)
          .some((e) => e.tick > tick)
        if (!hasOtherProgramChangeEvents) {
          sendEvent(programChangeMidiEvent(0, channel, programNumber))
        }
      }
    },
    [pushHistory, channel, sendEvent, position, getEvents, eventId, mutate],
  )
}
