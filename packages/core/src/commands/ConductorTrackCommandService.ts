import { clamp, min } from "lodash"
import { SetTempoEvent } from "midifile-ts"
import { transaction } from "mobx"
import {
  isSetTempoEvent,
  Measure,
  Song,
  TempoEventsClipboardData,
  Track,
  TrackEventOf,
} from "../entities"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "../helpers"
import { isNotUndefined } from "../helpers/array"
import { timeSignatureMidiEvent } from "../midi"
import { ISongStore } from "./interfaces"
import {
  duplicateEvents,
  removeRedundantEventsForEventIds,
} from "./TrackCommandService"

const moveTempoEvents =
  (conductorTrack: Track) =>
  (
    eventIds: number[],
    deltaTick: number,
    deltaValue: number,
    maxBPM: number,
  ) => {
    const events = eventIds
      .map(
        (id) =>
          conductorTrack.getEventById(
            id,
          ) as unknown as TrackEventOf<SetTempoEvent>,
      )
      .filter(isNotUndefined)

    conductorTrack.updateEvents(
      events.map((ev) => ({
        id: ev.id,
        tick: Math.max(0, Math.floor(ev.tick + deltaTick)),
        microsecondsPerBeat: Math.floor(
          bpmToUSecPerBeat(
            clamp(
              uSecPerBeatToBPM(ev.microsecondsPerBeat) + deltaValue,
              0,
              maxBPM,
            ),
          ),
        ),
      })),
    )
  }

const copyTempoEvents =
  (conductorTrack: Track) =>
  (eventIds: number[]): TempoEventsClipboardData | null => {
    // Copy selected events
    const events = eventIds
      .map((id) => conductorTrack.getEventById(id))
      .filter(isNotUndefined)
      .filter(isSetTempoEvent)

    const minTick = min(events.map((e) => e.tick))

    if (minTick === undefined) {
      return null
    }

    const relativePositionedEvents = events.map((note) => ({
      ...note,
      tick: note.tick - minTick,
    }))

    return {
      type: "tempo_events",
      events: relativePositionedEvents,
    }
  }

const pasteTempoEventsAt =
  (conductorTrack: Track) => (data: TempoEventsClipboardData, tick: number) => {
    const events = data.events.map((e) => ({
      ...e,
      tick: e.tick + tick,
    }))
    transaction(() => {
      events.forEach((e) => conductorTrack.createOrUpdate(e))
    })
  }

const getMeasureStartTick = (song: Song) => (tick: number) => {
  const { timebase, measures } = song
  return Measure.getMeasureStart(measures, tick, timebase).tick
}

const hasTimeSignatureAt = (song: Song) => (tick: number) => {
  const { timeSignatures } = song
  return timeSignatures.some((e) => e.tick === tick)
}

const addTimeSignature =
  (conductorTrack: Track) =>
  (tick: number, numerator: number, denominator: number) => {
    return conductorTrack.addEvent({
      ...timeSignatureMidiEvent(0, numerator, denominator),
      tick,
    })
  }

export const createConductorTrackCommandService = (songStore: ISongStore) => {
  function bindConductorTrack<Args extends unknown[], Result>(
    command: (conductorTrack: Track) => (...args: Args) => Result,
    // biome-ignore lint/suspicious/noConfusingVoidType: allow void for commands that may not return a value
  ): (...args: Args) => Result | void
  function bindConductorTrack<Args extends unknown[], Result>(
    command: (conductorTrack: Track) => (...args: Args) => Result,
    orFailure: Result,
  ): (...args: Args) => Result
  function bindConductorTrack<Args extends unknown[], Result>(
    command: (conductorTrack: Track) => (...args: Args) => Result,
    orFailure?: Result,
  ) {
    return (...args: Args) => {
      const conductorTrack = songStore.song?.conductorTrack
      if (!conductorTrack) {
        return orFailure
      }
      return command(conductorTrack)(...args)
    }
  }

  function bindSong<Args extends unknown[], Result>(
    command: (song: Song) => (...args: Args) => Result,
    orFailure: Result,
  ): (...args: Args) => Result {
    return (...args: Args) => {
      const song = songStore.song
      if (!song) {
        return orFailure
      }
      return command(song)(...args)
    }
  }

  return {
    duplicateEvents: bindConductorTrack(duplicateEvents, []),
    removeRedundantEventsForEventIds: bindConductorTrack(
      removeRedundantEventsForEventIds,
    ),
    copyTempoEvents: bindConductorTrack(copyTempoEvents, null),
    pasteTempoEventsAt: bindConductorTrack(pasteTempoEventsAt),
    moveTempoEvents: bindConductorTrack(moveTempoEvents),
    getMeasureStartTick: bindSong(getMeasureStartTick, 0),
    hasTimeSignatureAt: bindSong(hasTimeSignatureAt, false),
    addTimeSignature: bindConductorTrack(addTimeSignature, null),
  }
}

export type ConductorTrackCommandService = ReturnType<
  typeof createConductorTrackCommandService
>
