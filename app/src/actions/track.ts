import { clamp } from "lodash"
import { AnyChannelEvent, AnyEvent, SetTempoEvent } from "midifile-ts"
import { transaction } from "mobx"
import { ValueEventType } from "../entities/event/ValueEventType"
import { Range } from "../entities/geometry/Range"
import { Measure } from "../entities/measure/Measure"
import { closedRange, isNotUndefined } from "../helpers/array"
import { isEventInRange } from "../helpers/filterEvents"
import { addedSet, deletedSet } from "../helpers/set"
import { useConductorTrack } from "../hooks/useConductorTrack"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import { useTrack } from "../hooks/useTrack"
import {
  panMidiEvent,
  programChangeMidiEvent,
  timeSignatureMidiEvent,
  volumeMidiEvent,
} from "../midi/MidiEvent"
import Quantizer from "../quantizer"
import Track, {
  NoteEvent,
  TrackEvent,
  TrackEventOf,
  TrackId,
  isNoteEvent,
} from "../track"
import { useStopNote } from "./player"

export const useChangeTempo = () => {
  const { updateEvent } = useConductorTrack()
  const { pushHistory } = useHistory()
  return (id: number, microsecondsPerBeat: number) => {
    pushHistory()
    updateEvent<TrackEventOf<SetTempoEvent>>(id, {
      microsecondsPerBeat: microsecondsPerBeat,
    })
  }
}

/* events */

export const useChangeNotesVelocity = () => {
  const { selectedTrackId, setNewNoteVelocity } = usePianoRoll()
  const { updateEvents } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()

  return (noteIds: number[], velocity: number) => {
    pushHistory()
    updateEvents(
      noteIds.map((id) => ({
        id,
        velocity: velocity,
      })),
    )
    setNewNoteVelocity(velocity)
  }
}

export const useCreateEvent = () => {
  const { quantizer, selectedTrackId } = usePianoRoll()
  const { createOrUpdate } = useTrack(selectedTrackId)
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()

  return (e: AnyChannelEvent, tick?: number) => {
    pushHistory()
    const id = createOrUpdate({
      ...e,
      tick: quantizer.round(tick ?? position),
    })?.id

    // 即座に反映する
    // Reflect immediately
    if (tick !== undefined) {
      sendEvent(e)
    }

    return id
  }
}

export const useUpdateVelocitiesInRange = () => {
  const { selectedTrackId, selectedNoteIds } = usePianoRoll()
  const {
    getEventById,
    events: trackEvents,
    updateEvents,
  } = useTrack(selectedTrackId)

  return (
    startTick: number,
    startValue: number,
    endTick: number,
    endValue: number,
  ) => {
    const minTick = Math.min(startTick, endTick)
    const maxTick = Math.max(startTick, endTick)
    const minValue = Math.min(startValue, endValue)
    const maxValue = Math.max(startValue, endValue)
    const getValue = (tick: number) =>
      Math.floor(
        Math.min(
          maxValue,
          Math.max(
            minValue,
            ((tick - startTick) / (endTick - startTick)) *
              (endValue - startValue) +
              startValue,
          ),
        ),
      )

    const notes =
      selectedNoteIds.length > 0
        ? selectedNoteIds.map((id) => getEventById(id) as NoteEvent)
        : trackEvents.filter(isNoteEvent)

    const events = notes.filter(isEventInRange(Range.create(minTick, maxTick)))

    transaction(() => {
      updateEvents(
        events.map((e) => ({
          id: e.id,
          velocity: getValue(e.tick),
        })),
      )
    })
  }
}

// Update controller events in the range with linear interpolation values
export const useUpdateEventsInRange = (
  trackId: TrackId,
  quantizer: Quantizer,
  filterEvent: (e: TrackEvent) => boolean,
  createEvent: (value: number) => AnyEvent,
) => {
  const { events: trackEvents, removeEvents, addEvents } = useTrack(trackId)

  return (
    startValue: number,
    endValue: number,
    startTick: number,
    endTick: number,
  ) => {
    const minTick = Math.min(startTick, endTick)
    const maxTick = Math.max(startTick, endTick)
    const _startTick = quantizer.floor(Math.max(0, minTick))
    const _endTick = quantizer.floor(Math.max(0, maxTick))

    const minValue = Math.min(startValue, endValue)
    const maxValue = Math.max(startValue, endValue)

    // linear interpolate
    const getValue =
      endTick === startTick
        ? () => endValue
        : (tick: number) =>
            Math.floor(
              Math.min(
                maxValue,
                Math.max(
                  minValue,
                  ((tick - startTick) / (endTick - startTick)) *
                    (endValue - startValue) +
                    startValue,
                ),
              ),
            )

    // Delete events in the dragged area
    const events = trackEvents.filter(filterEvent).filter(
      (e) =>
        // to prevent remove the event created previously, do not remove the event placed at startTick
        e.tick !== startTick &&
        e.tick >= Math.min(minTick, _startTick) &&
        e.tick <= Math.max(maxTick, _endTick),
    )

    transaction(() => {
      removeEvents(events.map((e) => e.id))

      const newEvents = closedRange(_startTick, _endTick, quantizer.unit).map(
        (tick) => ({
          ...createEvent(getValue(tick)),
          tick,
        }),
      )

      addEvents(newEvents)
    })
  }
}

export const useUpdateValueEvents = (type: ValueEventType) => {
  const { selectedTrackId, quantizer } = usePianoRoll()

  return useUpdateEventsInRange(
    selectedTrackId,
    quantizer,
    ValueEventType.getEventPredicate(type),
    ValueEventType.getEventFactory(type),
  )
}

/* note */

export const useMuteNote = () => {
  const { selectedTrackId } = usePianoRoll()
  const { channel } = useTrack(selectedTrackId)
  const stopNote = useStopNote()

  return (noteNumber: number) => {
    if (channel == undefined) {
      return
    }
    stopNote({ channel, noteNumber })
  }
}

/* track meta */

export const useSetTrackName = () => {
  const { selectedTrackId } = usePianoRoll()
  const { setName } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()

  return (name: string) => {
    pushHistory()
    setName(name)
  }
}

export const useSetTrackVolume = () => {
  const { position, sendEvent } = usePlayer()
  const song = useSong()
  const { pushHistory } = useHistory()

  return (trackId: TrackId, volume: number) => {
    pushHistory()
    const track = song.getTrack(trackId)
    if (track === undefined) {
      return
    }

    track.setVolume(volume, position)

    if (track.channel !== undefined) {
      sendEvent(volumeMidiEvent(0, track.channel, volume))
    }
  }
}

export const useSetTrackPan = () => {
  const { position, sendEvent } = usePlayer()
  const song = useSong()
  const { pushHistory } = useHistory()

  return (trackId: TrackId, pan: number) => {
    pushHistory()
    const track = song.getTrack(trackId)
    if (track === undefined) {
      return
    }

    track.setPan(pan, position)

    if (track.channel !== undefined) {
      sendEvent(panMidiEvent(0, track.channel, pan))
    }
  }
}

export const useSetTrackInstrument = () => {
  const { sendEvent } = usePlayer()
  const song = useSong()
  const { pushHistory } = useHistory()

  return (trackId: TrackId, programNumber: number) => {
    pushHistory()
    const track = song.getTrack(trackId)
    if (track === undefined) {
      return
    }

    track.setProgramNumber(programNumber)

    // 即座に反映する
    // Reflect immediately
    if (track.channel !== undefined) {
      sendEvent(programChangeMidiEvent(0, track.channel, programNumber))
    }
  }
}

export const useToggleGhostTrack = () => {
  const { notGhostTrackIds, setNotGhostTrackIds } = usePianoRoll()
  const { pushHistory } = useHistory()

  return (trackId: TrackId) => {
    pushHistory()
    if (notGhostTrackIds.has(trackId)) {
      setNotGhostTrackIds(deletedSet(notGhostTrackIds, trackId))
    } else {
      setNotGhostTrackIds(addedSet(notGhostTrackIds, trackId))
    }
  }
}

export const useToggleAllGhostTracks = () => {
  const { notGhostTrackIds, setNotGhostTrackIds } = usePianoRoll()
  const song = useSong()
  const { pushHistory } = useHistory()

  return () => {
    pushHistory()
    if (notGhostTrackIds.size > Math.floor(song.tracks.length / 2)) {
      setNotGhostTrackIds(new Set())
    } else {
      setNotGhostTrackIds(new Set(song.tracks.map((t) => t.id)))
    }
  }
}

export const useAddTimeSignature = () => {
  const song = useSong()
  const { pushHistory } = useHistory()
  const { measures, timeSignatures, addEvent } = useConductorTrack()

  return (tick: number, numerator: number, denominator: number) => {
    const measureStartTick = Measure.getMeasureStart(
      measures,
      tick,
      song.timebase,
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
  }
}

export const useUpdateTimeSignature = () => {
  const { updateEvent } = useConductorTrack()
  const { pushHistory } = useHistory()

  return (id: number, numerator: number, denominator: number) => {
    pushHistory()
    updateEvent(id, {
      numerator,
      denominator,
    })
  }
}

export interface BatchUpdateOperation {
  readonly type: "set" | "add" | "multiply"
  readonly value: number
}

export const batchUpdateNotesVelocity = (
  track: Track,
  noteIds: number[],
  operation: BatchUpdateOperation,
) => {
  const selectedNotes = noteIds
    .map((id) => track.getEventById(id))
    .filter(isNotUndefined)
    .filter(isNoteEvent)
  track.updateEvents(
    selectedNotes.map((note) => ({
      id: note.id,
      velocity: clamp(
        Math.floor(applyOperation(operation, note.velocity)),
        1,
        127,
      ),
    })),
  )
}

export const useBatchUpdateSelectedNotesVelocity = () => {
  const { selectedTrack, selectedNoteIds } = usePianoRoll()
  const { pushHistory } = useHistory()

  return (operation: BatchUpdateOperation) => {
    if (selectedTrack === undefined) {
      return
    }
    pushHistory()
    batchUpdateNotesVelocity(selectedTrack, selectedNoteIds, operation)
  }
}

const applyOperation = (operation: BatchUpdateOperation, value: number) => {
  switch (operation.type) {
    case "set":
      return operation.value
    case "add":
      return value + operation.value
    case "multiply":
      return value * operation.value
  }
}
