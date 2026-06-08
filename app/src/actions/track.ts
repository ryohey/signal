import {
  type BatchUpdateOperation,
  getProgramNumberEvent,
  isProgramChangeEvent,
  programChangeMidiEvent,
  TrackEvent,
  TrackEventOf,
  TrackId,
} from "@signal-app/core"
import type { AnyChannelEvent, AnyEvent, ProgramChangeEvent } from "midifile-ts"
import { useCallback } from "react"
import { ValueEventType } from "../features/control-pane/entities/ValueEventType"
import { usePianoRoll } from "../features/piano-roll/hooks/usePianoRoll"
import { addedSet, deletedSet } from "../helpers/set"
import { useCommands } from "../hooks/useCommands"
import { useConductorTrack } from "../hooks/useConductorTrack"
import { useHistory } from "../hooks/useHistory"
import { usePlayer } from "../hooks/usePlayer"
import { useQuantizer } from "../hooks/useQuantizer"
import { useSong } from "../hooks/useSong"
import { useTrack } from "../hooks/useTrack"
import { useStopNote } from "./player"

/* events */

export const useChangeNotesVelocity = () => {
  const { selectedTrackId, setNewNoteVelocity } = usePianoRoll()
  const { updateEvents } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()

  return useCallback(
    (noteIds: number[], velocity: number) => {
      pushHistory()
      updateEvents(
        noteIds.map((id) => ({
          id,
          velocity: velocity,
        })),
      )
      setNewNoteVelocity(velocity)
    },
    [pushHistory, updateEvents, setNewNoteVelocity],
  )
}

export const useCreateEvent = () => {
  const { selectedTrackId } = usePianoRoll()
  const { quantizeRound } = useQuantizer()
  const { createOrUpdate } = useTrack(selectedTrackId)
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()

  return useCallback(
    (e: AnyChannelEvent, tick?: number) => {
      pushHistory()
      const id = createOrUpdate({
        ...e,
        tick: quantizeRound(tick ?? position),
      })?.id

      // 即座に反映する
      // Reflect immediately
      if (tick !== undefined) {
        sendEvent(e)
      }

      return id
    },
    [pushHistory, createOrUpdate, quantizeRound, position, sendEvent],
  )
}

// Update controller events in the range with linear interpolation values
export const useUpdateEventsInRange = (
  trackId: TrackId,
  filterEvent: (e: TrackEvent) => boolean,
  createEvent: (value: number) => AnyEvent,
) => {
  const { quantizeFloor, quantizeUnit } = useQuantizer()
  const commands = useCommands()

  return useCallback(
    (
      startValue: number,
      endValue: number,
      startTick: number,
      endTick: number,
    ) => {
      commands.track.updateEventsInRange(
        trackId,
        filterEvent,
        createEvent,
        quantizeFloor,
        quantizeUnit,
        startValue,
        endValue,
        startTick,
        endTick,
      )
    },
    [commands, trackId, filterEvent, createEvent, quantizeFloor, quantizeUnit],
  )
}

export const useUpdateValueEvents = (type: ValueEventType) => {
  const { selectedTrackId } = usePianoRoll()

  return useUpdateEventsInRange(
    selectedTrackId,
    ValueEventType.getEventPredicate(type),
    ValueEventType.getEventFactory(type),
  )
}

export const useUpdateValueEventsWithCurve = (type: ValueEventType) => {
  const { selectedTrackId } = usePianoRoll()
  const { quantizeFloor, quantizeUnit } = useQuantizer()
  const commands = useCommands()

  return useCallback(
    (
      startValue: number,
      endValue: number,
      startTick: number,
      endTick: number,
      easing: (t: number) => number,
    ) => {
      commands.track.updateEventsInRangeWithEasing(
        selectedTrackId,
        ValueEventType.getEventPredicate(type),
        ValueEventType.getEventFactory(type),
        quantizeFloor,
        quantizeUnit,
        startValue,
        endValue,
        startTick,
        endTick,
        easing,
      )
    },
    [commands, selectedTrackId, type, quantizeFloor, quantizeUnit],
  )
}

/* note */

export const useMuteNote = () => {
  const { selectedTrackId } = usePianoRoll()
  const { channel } = useTrack(selectedTrackId)
  const stopNote = useStopNote()

  return useCallback(
    (noteNumber: number) => {
      if (channel === undefined) {
        return
      }
      stopNote({ channel, noteNumber })
    },
    [channel, stopNote],
  )
}

/* track meta */

export const useSetTrackName = () => {
  const { selectedTrackId } = usePianoRoll()
  const { setName } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()

  return useCallback(
    (name: string) => {
      pushHistory()
      setName(name)
    },
    [pushHistory, setName],
  )
}

export const useSetTrackInstrument = (trackId: TrackId, eventId?: number) => {
  const { sendEvent, position } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel, getEvents, updateEvent, addEvent } = useTrack(trackId)

  return useCallback(
    (programNumber: number) => {
      pushHistory()

      let targetEventId: number | undefined = eventId

      if (eventId === undefined) {
        // get last program change event before position
        const programNumberEvent =
          getProgramNumberEvent(getEvents(), position) ??
          addEvent<TrackEventOf<ProgramChangeEvent>>({
            ...programChangeMidiEvent(0, 0, programNumber),
            tick: 0,
          })
        targetEventId = programNumberEvent?.id
      }

      if (targetEventId === undefined) {
        return
      }

      const targetEvent = updateEvent<TrackEventOf<ProgramChangeEvent>>(
        targetEventId,
        {
          value: programNumber,
        },
      )

      if (targetEvent === null) {
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
    [
      pushHistory,
      channel,
      sendEvent,
      position,
      getEvents,
      eventId,
      updateEvent,
      addEvent,
    ],
  )
}

export const useInsertTrackInstrument = (trackId: TrackId) => {
  const { sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel, addEvent } = useTrack(trackId)

  return useCallback(
    (programNumber: number, tick: number) => {
      if (channel === undefined) {
        return
      }

      pushHistory()

      addEvent<TrackEventOf<ProgramChangeEvent>>({
        ...programChangeMidiEvent(0, 0, programNumber),
        tick,
      })

      sendEvent(programChangeMidiEvent(0, channel, programNumber))
    },
    [pushHistory, channel, sendEvent, addEvent],
  )
}

export const useToggleGhostTrack = () => {
  const { notGhostTrackIds, setNotGhostTrackIds } = usePianoRoll()
  const { pushHistory } = useHistory()

  return useCallback(
    (trackId: TrackId) => {
      pushHistory()
      if (notGhostTrackIds.has(trackId)) {
        setNotGhostTrackIds(deletedSet(trackId))
      } else {
        setNotGhostTrackIds(addedSet(trackId))
      }
    },
    [pushHistory, notGhostTrackIds, setNotGhostTrackIds],
  )
}

export const useToggleAllGhostTracks = () => {
  const { notGhostTrackIds, setNotGhostTrackIds } = usePianoRoll()
  const { tracks } = useSong()
  const { pushHistory } = useHistory()

  return useCallback(() => {
    pushHistory()
    if (notGhostTrackIds.size > Math.floor(tracks.length / 2)) {
      setNotGhostTrackIds(new Set())
    } else {
      setNotGhostTrackIds(new Set(tracks.map((t) => t.id)))
    }
  }, [pushHistory, notGhostTrackIds, setNotGhostTrackIds, tracks])
}

export const useAddTimeSignature = () => {
  const { pushHistory } = useHistory()
  const commands = useCommands()

  return useCallback(
    (tick: number, numerator: number, denominator: number) => {
      const measureStartTick = commands.conductorTrack.getMeasureStartTick(tick)

      // prevent duplication
      if (commands.conductorTrack.hasTimeSignatureAt(measureStartTick)) {
        return
      }

      pushHistory()

      commands.conductorTrack.addTimeSignature(
        measureStartTick,
        numerator,
        denominator,
      )
    },
    [pushHistory, commands],
  )
}

export const useUpdateTimeSignature = () => {
  const { updateEvent } = useConductorTrack()
  const { pushHistory } = useHistory()

  return useCallback(
    (id: number, numerator: number, denominator: number) => {
      pushHistory()
      updateEvent(id, {
        numerator,
        denominator,
      })
    },
    [pushHistory, updateEvent],
  )
}

export const useBatchUpdateSelectedNotesVelocity = () => {
  const { selectedTrackId, selectedNoteIds } = usePianoRoll()
  const { pushHistory } = useHistory()
  const commands = useCommands()

  return useCallback(
    (operation: BatchUpdateOperation) => {
      pushHistory()
      commands.track.batchUpdateNotesVelocity(
        selectedTrackId,
        selectedNoteIds,
        operation,
      )
    },
    [selectedTrackId, selectedNoteIds, pushHistory, commands],
  )
}
