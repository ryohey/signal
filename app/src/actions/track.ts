import { clamp } from "lodash"
import { AnyChannelEvent, AnyEvent, SetTempoEvent } from "midifile-ts"
import { ValueEventType } from "../entities/event/ValueEventType"
import { Range } from "../entities/geometry/Range"
import { Measure } from "../entities/measure/Measure"
import { closedRange, isNotUndefined } from "../helpers/array"
import { isEventInRange } from "../helpers/filterEvents"
import { useStores } from "../hooks/useStores"
import {
  panMidiEvent,
  programChangeMidiEvent,
  timeSignatureMidiEvent,
  volumeMidiEvent,
} from "../midi/MidiEvent"
import Quantizer from "../quantizer"
import RootStore from "../stores/RootStore"
import Track, {
  NoteEvent,
  TrackEvent,
  TrackEventOf,
  TrackId,
  isNoteEvent,
} from "../track"
import { useStopNote } from "./player"

export const changeTempo =
  ({ song, pushHistory }: RootStore) =>
  (id: number, microsecondsPerBeat: number) => {
    const track = song.conductorTrack
    if (track === undefined) {
      return
    }
    pushHistory()
    track.updateEvent<TrackEventOf<SetTempoEvent>>(id, {
      microsecondsPerBeat: microsecondsPerBeat,
    })
  }

/* events */

export const changeNotesVelocity =
  ({
    pianoRollStore,
    pianoRollStore: { selectedTrack },
    pushHistory,
  }: RootStore) =>
  (noteIds: number[], velocity: number) => {
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

export const createEvent =
  ({
    player,
    pianoRollStore: { quantizer, selectedTrack },
    pushHistory,
  }: RootStore) =>
  (e: AnyChannelEvent, tick?: number) => {
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

export const updateVelocitiesInRange =
  (rootStore: RootStore) =>
  (
    startTick: number,
    startValue: number,
    endTick: number,
    endValue: number,
  ) => {
    const {
      pianoRollStore: { selectedTrack, selectedNoteIds },
    } = rootStore
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
        ? (_tick: number) => endValue
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

export const updateValueEvents =
  (type: ValueEventType) =>
  ({ pianoRollStore }: RootStore) =>
    updateEventsInRange(
      pianoRollStore.selectedTrack,
      pianoRollStore.quantizer,
      ValueEventType.getEventPredicate(type),
      ValueEventType.getEventFactory(type),
    )

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

export const setTrackName =
  ({ pianoRollStore: { selectedTrack }, pushHistory }: RootStore) =>
  (name: string) => {
    if (selectedTrack === undefined) {
      return
    }
    pushHistory()
    selectedTrack.setName(name)
  }

export const setTrackVolume =
  ({ song, player, pushHistory }: RootStore) =>
  (trackId: TrackId, volume: number) => {
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

export const setTrackPan =
  ({ song, player, pushHistory }: RootStore) =>
  (trackId: TrackId, pan: number) => {
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

export const setTrackInstrument =
  ({ song, player, pushHistory }: RootStore) =>
  (trackId: TrackId, programNumber: number) => {
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

export const toogleGhostTrack =
  ({ pianoRollStore, pushHistory }: RootStore) =>
  (trackId: TrackId) => {
    pushHistory()
    if (pianoRollStore.notGhostTrackIds.has(trackId)) {
      pianoRollStore.notGhostTrackIds.delete(trackId)
    } else {
      pianoRollStore.notGhostTrackIds.add(trackId)
    }
  }

export const toogleAllGhostTracks =
  ({ song, pianoRollStore, pushHistory }: RootStore) =>
  () => {
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

export const addTimeSignature =
  ({ song, pushHistory }: RootStore) =>
  (tick: number, numerator: number, denominator: number) => {
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

export const updateTimeSignature =
  ({ song, pushHistory }: RootStore) =>
  (id: number, numerator: number, denominator: number) => {
    pushHistory()
    song.conductorTrack?.updateEvent(id, {
      numerator,
      denominator,
    })
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
        0,
        127,
      ),
    })),
  )
}

export const batchUpdateSelectedNotesVelocity =
  ({ pianoRollStore, pushHistory }: RootStore) =>
  (operation: BatchUpdateOperation) => {
    const { selectedTrack, selectedNoteIds } = pianoRollStore
    if (selectedTrack === undefined) {
      return
    }
    pushHistory()
    batchUpdateNotesVelocity(selectedTrack, selectedNoteIds, operation)
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
