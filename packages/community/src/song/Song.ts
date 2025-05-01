import { DistributiveOmit } from "@emotion/react"
import { AnyEvent } from "midifile-ts"
import { addTick } from "../helpers/addTick.js"
import { getEndOfTrack } from "../track/Track.js"

export type TrackEventOf<T> = DistributiveOmit<T, "deltaTime"> & {
  tick: number
}

export type TrackEvent = TrackEventOf<AnyEvent>

export interface Track {
  events: readonly TrackEvent[]
  endOfTrack: number
}

interface Midi {
  header: {
    ticksPerBeat: number
  }
  tracks: AnyEvent[][]
}

export class Song {
  readonly timebase: number
  readonly endOfSong: number
  readonly tracks: Track[]

  constructor(midi: Midi) {
    this.timebase = midi.header.ticksPerBeat
    this.tracks = midi.tracks.map((track) => {
      const events = addTick(track)
      const endOfTrack = getEndOfTrack(events)
      return { events, endOfTrack }
    })
    this.endOfSong = this.tracks
      .map((track) => track.endOfTrack)
      .reduce((a, b) => Math.max(a, b), 0)
  }
}

export const emptySong = () =>
  new Song({
    header: { ticksPerBeat: 480 },
    tracks: [],
  })
