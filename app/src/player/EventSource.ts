import { Range } from "@signal-app/core"
import { IEventSource, PlayerEvent, SendableEvent } from "@signal-app/player"
import { Beat } from "../entities/beat/Beat"
import { isEventInRange } from "../helpers/filterEvents"
import { noteOnMidiEvent } from "../midi/MidiEvent"
import { SongStore } from "../stores/SongStore"
import { TrackId } from "../track"
import { getStatusEvents } from "../track/selector"
import { convertTrackEvents } from "./collectAllEvents"

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
    return song.allEvents.filter(isEventInRange(range)).concat(beatEvents)
  }

  getCurrentStateEvents(tick: number): SendableEvent[] {
    return this.songStore.song.tracks.flatMap((t) => {
      const statusEvents = getStatusEvents(t.events, tick)
      return convertTrackEvents(statusEvents, t.channel, t.id)
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
