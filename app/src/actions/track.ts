import { clamp } from "lodash"
import { AnyChannelEvent, AnyEvent, SetTempoEvent } from "midifile-ts"
import { ValueEventType } from "../entities/event/ValueEventType"
import { Range } from "../entities/geometry/Range"
import { Measure } from "../entities/measure/Measure"
import { closedRange, isNotUndefined } from "../helpers/array"
import { isEventInRange } from "../helpers/filterEvents"
import { useHistory } from "../hooks/useHistory"
import { useStores } from "../hooks/useStores"
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
  const { song } = useStores()
  const { pushHistory } = useHistory()
  return (id: number, microsecondsPerBeat: number) => {
    const track = song.conductorTrack
    if (track === undefined) {
      return
    }
    pushHistory()
    track.updateEvent<TrackEventOf<SetTempoEvent>>(id, {
      microsecondsPerBeat: microsecondsPerBeat,
    })
  }
}

/* events */

export const useChangeNotesVelocity = () => {
  const { pianoRollStore } = useStores()
  const { pushHistory } = useHistory()
  return (noteIds: number[], velocity: number) => {
    const { selectedTrack } = pianoRollStore
    if (selectedTrack === undefined) {
      return
    }
    pushHistory()
    selectedTrack.updateEvents(
      noteIds.map((id) => ({
        id,
        velocity: velocity,
      })),
    )
    pianoRollStore.newNoteVelocity = velocity
  }
}

export const useCreateEvent = () => {
  const { player, pianoRollStore } = useStores()
  const { pushHistory } = useHistory()
  const { quantizer, selectedTrack } = pianoRollStore
  return (e: AnyChannelEvent, tick?: number) => {
    if (selectedTrack === undefined) {
      throw new Error("selected track is undefined")
    }
    pushHistory()
    const id = selectedTrack.createOrUpdate({
      ...e,
      tick: quantizer.round(tick ?? player.position),
    }).id

    // 即座に反映する
    // Reflect immediately
    if (tick !== undefined) {
      player.sendEvent(e)
    }

    return id
  }
}

export const useUpdateVelocitiesInRange = () => {
  const { pianoRollStore } = useStores()
  return (
    startTick: number,
    startValue: number,
    endTick: number,
    endValue: number,
  ) => {
    const { selectedTrack, selectedNoteIds } = pianoRollStore
    if (selectedTrack === undefined) {
      return
    }
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
        ? selectedNoteIds.map(
            (id) => selectedTrack.getEventById(id) as NoteEvent,
          )
        : selectedTrack.events.filter(isNoteEvent)

    const events = notes.filter(isEventInRange(Range.create(minTick, maxTick)))
    selectedTrack.transaction((it) => {
      it.updateEvents(
        events.map((e) => ({
          id: e.id,
          velocity: getValue(e.tick),
        })),
      )
    })
  }
}

// Update controller events in the range with linear interpolation values
export const updateEventsInRange =
  (
    track: Track | undefined,
    quantizer: Quantizer,
    filterEvent: (e: TrackEvent) => boolean,
    createEvent: (value: number) => AnyEvent,
  ) =>
  (
    startValue: number,
    endValue: number,
    startTick: number,
    endTick: number,
  ) => {
    if (track === undefined) {
      throw new Error("track is undefined")
    }

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
    const events = track.events.filter(filterEvent).filter(
      (e) =>
        // to prevent remove the event created previously, do not remove the event placed at startTick
        e.tick !== startTick &&
        e.tick >= Math.min(minTick, _startTick) &&
        e.tick <= Math.max(maxTick, _endTick),
    )

    track.transaction((it) => {
      it.removeEvents(events.map((e) => e.id))

      const newEvents = closedRange(_startTick, _endTick, quantizer.unit).map(
        (tick) => ({
          ...createEvent(getValue(tick)),
          tick,
        }),
      )

      it.addEvents(newEvents)
    })
  }

export const useUpdateValueEvents = () => {
  const { pianoRollStore } = useStores()

  return (type: ValueEventType) =>
    updateEventsInRange(
      pianoRollStore.selectedTrack,
      pianoRollStore.quantizer,
      ValueEventType.getEventPredicate(type),
      ValueEventType.getEventFactory(type),
    )
}

/* note */

export const useMuteNote = () => {
  const {
    pianoRollStore: { selectedTrack },
  } = useStores()
  const stopNote = useStopNote()

  return (noteNumber: number) => {
    if (selectedTrack === undefined || selectedTrack.channel == undefined) {
      return
    }
    stopNote({ channel: selectedTrack.channel, noteNumber })
  }
}

/* track meta */

export const useSetTrackName = () => {
  const { pianoRollStore } = useStores()
  const { pushHistory } = useHistory()
  const { selectedTrack } = pianoRollStore

  return (name: string) => {
    if (selectedTrack === undefined) {
      return
    }
    pushHistory()
    selectedTrack.setName(name)
  }
}

export const useSetTrackVolume = () => {
  const { song, player } = useStores()
  const { pushHistory } = useHistory()

  return (trackId: TrackId, volume: number) => {
    pushHistory()
    const track = song.getTrack(trackId)
    if (track === undefined) {
      return
    }

    track.setVolume(volume, player.position)

    if (track.channel !== undefined) {
      player.sendEvent(volumeMidiEvent(0, track.channel, volume))
    }
  }
}

export const useSetTrackPan = () => {
  const { song, player } = useStores()
  const { pushHistory } = useHistory()

  return (trackId: TrackId, pan: number) => {
    pushHistory()
    const track = song.getTrack(trackId)
    if (track === undefined) {
      return
    }

    track.setPan(pan, player.position)

    if (track.channel !== undefined) {
      player.sendEvent(panMidiEvent(0, track.channel, pan))
    }
  }
}

export const useSetTrackInstrument = () => {
  const { song, player } = useStores()
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
      player.sendEvent(programChangeMidiEvent(0, track.channel, programNumber))
    }
  }
}

export const useToggleGhostTrack = () => {
  const { pianoRollStore } = useStores()
  return (trackId: TrackId) => {
    pushHistory()
    if (pianoRollStore.notGhostTrackIds.has(trackId)) {
      pianoRollStore.notGhostTrackIds.delete(trackId)
    } else {
      pianoRollStore.notGhostTrackIds.add(trackId)
    }
  }
}

export const useToggleAllGhostTracks = () => {
  const { song, pianoRollStore } = useStores()
  const { pushHistory } = useHistory()

  return () => {
    pushHistory()
    if (
      pianoRollStore.notGhostTrackIds.size > Math.floor(song.tracks.length / 2)
    ) {
      pianoRollStore.notGhostTrackIds = new Set()
    } else {
      for (const track of song.tracks) {
        pianoRollStore.notGhostTrackIds.add(track.id)
      }
    }
  }
}

export const useAddTimeSignature = () => {
  const { song } = useStores()
  const { pushHistory } = useHistory()

  return (tick: number, numerator: number, denominator: number) => {
    const measureStartTick = Measure.getMeasureStart(
      song.measures,
      tick,
      song.timebase,
    ).tick

    // prevent duplication
    if (song.timeSignatures?.some((e) => e.tick === measureStartTick)) {
      return
    }

    pushHistory()

    song.conductorTrack?.addEvent({
      ...timeSignatureMidiEvent(0, numerator, denominator),
      tick: measureStartTick,
    })
  }
}

export const useUpdateTimeSignature = () => {
  const { song } = useStores()
  const { pushHistory } = useHistory()

  return (id: number, numerator: number, denominator: number) => {
    pushHistory()
    song.conductorTrack?.updateEvent(id, {
      numerator,
      denominator,
    })
  }
}

export interface BatchUpdateOperation {
  type: "set" | "add" | "multiply"
  value: number
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
  const {
    pianoRollStore: { selectedTrack, selectedNoteIds },
  } = useStores()
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
