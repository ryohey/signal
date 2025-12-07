import {
  Beat,
  convertTrackEvents,
  getStatusEvents,
  isEventInRange,
  noteOnMidiEvent,
  Range,
  type TrackId,
} from "@signal-app/core"
import type {
  IEventSource,
  PlayerEvent,
  SendableEvent,
} from "@signal-app/player"
import type { SongStore } from "../stores/SongStore"

export const METRONOME_TRACK_ID = 99999 as TrackId

export class EventSource implements IEventSource {
  constructor(private readonly songStore: SongStore) {}

  get timebase(): number {
    return this.songStore.song.timebase
  }

  get endOfSong(): number {
    return this.songStore.song.endOfSong
  }

  getEvents(startTick: number, endTick: number): PlayerEvent[] {
    const { song } = this.songStore
    const range = Range.create(startTick, endTick)
    const beatEvents = Beat.createInRange(song.measures, song.timebase, range)
      .filter(isEventInRange(range))
      .flatMap((b) => beatToEvents(b))
    return (song.allEvents as PlayerEvent[])
      .filter(isEventInRange(range))
      .concat(beatEvents)
  }

  getCurrentStateEvents(tick: number): SendableEvent[] {
    return this.songStore.song.tracks.flatMap((t) => {
      const statusEvents = getStatusEvents(t.events, tick)
      return convertTrackEvents(
        statusEvents,
        t.channel,
        t.id
      ) as SendableEvent[]
    })
  }
}

function beatToEvents(beat: Beat): PlayerEvent[] {
  const velocity = beat.beat === 0 ? 100 : 70
  const noteNumber = beat.beat === 0 ? 76 : 77
  return [
    {
      ...noteOnMidiEvent(0, 9, noteNumber, velocity),
      tick: beat.tick,
      trackId: METRONOME_TRACK_ID,
    },
  ]
}
