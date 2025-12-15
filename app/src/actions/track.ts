import {
  BatchUpdateOperation,
  Measure,
  programChangeMidiEvent,
  timeSignatureMidiEvent,
  TrackEvent,
  TrackEventOf,
  TrackId,
} from "@signal-app/core"
import { AnyChannelEvent, AnyEvent, SetTempoEvent } from "midifile-ts"
import { useCallback } from "react"
import { ValueEventType } from "../entities/event/ValueEventType"
import { addedSet, deletedSet } from "../helpers/set"
import { useCommands } from "../hooks/useCommands"
import { useConductorTrack } from "../hooks/useConductorTrack"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useQuantizer } from "../hooks/useQuantizer"
import { useSong } from "../hooks/useSong"
import { useTrack } from "../hooks/useTrack"
import { useStopNote } from "./player"

export const useChangeTempo = () => {
  const { updateEvent } = useConductorTrack()
  const { pushHistory } = useHistory()
  return useCallback(
    (id: number, microsecondsPerBeat: number) => {
      pushHistory()
      updateEvent<TrackEventOf<SetTempoEvent>>(id, {
        microsecondsPerBeat: microsecondsPerBeat,
      })
    },
    [updateEvent, pushHistory],
  )
}

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

/* note */

export const useMuteNote = () => {
  const { selectedTrackId } = usePianoRoll()
  const { channel } = useTrack(selectedTrackId)
  const stopNote = useStopNote()

  return useCallback(
    (noteNumber: number) => {
      if (channel == undefined) {
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

export const useSetTrackInstrument = (trackId: TrackId) => {
  const { sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel, setProgramNumber } = useTrack(trackId)

  return useCallback(
    (programNumber: number) => {
      pushHistory()
      setProgramNumber(programNumber)

      // 即座に反映する
      // Reflect immediately
      if (channel !== undefined) {
        sendEvent(programChangeMidiEvent(0, channel, programNumber))
      }
    },
    [pushHistory, setProgramNumber, channel, sendEvent],
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
  const { timebase } = useSong()
  const { pushHistory } = useHistory()
  const { measures, timeSignatures, addEvent } = useConductorTrack()

  return useCallback(
    (tick: number, numerator: number, denominator: number) => {
      const measureStartTick = Measure.getMeasureStart(
        measures,
        tick,
        timebase,
      ).tick

      // prevent duplication
      if (timeSignatures.some((e) => e.tick === measureStartTick)) {
        return
      }

      pushHistory()

      addEvent({
        ...timeSignatureMidiEvent(0, numerator, denominator),
        tick: measureStartTick,
      })
    },
    [timebase, pushHistory, measures, timeSignatures, addEvent],
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
