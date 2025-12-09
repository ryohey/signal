import * as fs from "node:fs"
import * as path from "node:path"
import type { AnyEvent } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { emptySong, type NoteEvent, type Track } from "../entities"
import {
  noteOffMidiEvent,
  noteOnMidiEvent,
  setTempoMidiEvent,
  timeSignatureMidiEvent,
} from "./MidiEvent"
import {
  createConductorTrackIfNeeded,
  songFromMidi,
  songToMidi,
  songToMidiEvents,
} from "./midiConversion"

// id for each event will not be serialized in midi file
// we change ids sorted by order in events array
const reassignIDs = (track: Track) => {
  track.events.forEach((_e, i) => {
    track.events[i].id = i
  })
}

describe("SongFile", () => {
  it("write and read", () => {
    const song = emptySong()
    song.tracks[1].addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      noteNumber: 57,
      tick: 960,
      velocity: 127,
      duration: 240,
    })
    song.tracks.forEach(reassignIDs)
    const bytes = songToMidi(song)
    const song2 = songFromMidi(bytes)
    song2.filepath = song.filepath // filepath will not be serialized
    expect(song2.serialize()).toStrictEqual(song.serialize())
  })
  describe("songToMidiEvents", () => {
    const expectEveryTrackHaveEndOfTrackEvent = (tracks: AnyEvent[][]) => {
      for (const track of tracks) {
        expect(
          track.findIndex(
            (e) => e.type === "meta" && e.subtype === "endOfTrack"
          )
        ).toBe(track.length - 1)
      }
    }

    const openFile = (fileName: string): AnyEvent[][] => {
      const song = songFromMidi(
        new DataView(
          fs.readFileSync(path.join(__dirname, "../../testdata/", fileName))
            .buffer
        )
      )
      return songToMidiEvents(song)
    }

    describe("format 1", () => {
      const rawTracks = openFile("tracks.mid")

      it("every tracks have endOfTrack event", () => {
        expect(rawTracks.length).toBe(18)
        expectEveryTrackHaveEndOfTrackEvent(rawTracks)
      })
    })

    describe("format 0", () => {
      const rawTracks = openFile("format0.mid")

      it("every tracks have endOfTrack event", () => {
        expect(rawTracks.length).toBe(17)
        expectEveryTrackHaveEndOfTrackEvent(rawTracks)
      })
    })
  })

  describe("signal events", () => {
    it("should save the track color", () => {
      const song = emptySong()
      song.tracks[1].setColor({
        red: 12,
        green: 34,
        blue: 56,
        alpha: 78,
      })
      const bytes = songToMidi(song)
      const song2 = songFromMidi(bytes)
      expect(song2.tracks[1].color).toMatchObject({
        red: 12,
        green: 34,
        blue: 56,
        alpha: 78,
      })
    })
  })
  describe("createConductorTrackIfNeeded", () => {
    it("should not create the conductor track", () => {
      const tracks: AnyEvent[][] = [
        [timeSignatureMidiEvent(0, 4, 4), setTempoMidiEvent(120, 500000)],
        [noteOnMidiEvent(0, 1, 60, 100), noteOffMidiEvent(120, 1, 60, 0)],
      ]
      const result = createConductorTrackIfNeeded(tracks)
      expect(result).toStrictEqual([
        [timeSignatureMidiEvent(0, 4, 4), setTempoMidiEvent(120, 500000)],
        [noteOnMidiEvent(0, 1, 60, 100), noteOffMidiEvent(120, 1, 60, 0)],
      ])
    })
    it("should create the conductor track", () => {
      const tracks: AnyEvent[][] = [
        [
          timeSignatureMidiEvent(0, 4, 4),
          setTempoMidiEvent(120, 500000),
          noteOnMidiEvent(120, 5, 60, 100),
          noteOffMidiEvent(120, 5, 60, 0),
        ],
        [noteOnMidiEvent(0, 2, 60, 100), noteOffMidiEvent(120, 2, 60, 0)],
      ]
      const result = createConductorTrackIfNeeded(tracks)
      expect(result).toStrictEqual([
        [timeSignatureMidiEvent(0, 4, 4), setTempoMidiEvent(120, 500000)],
        [noteOnMidiEvent(240, 5, 60, 100), noteOffMidiEvent(120, 5, 60, 0)],
        [noteOnMidiEvent(0, 2, 60, 100), noteOffMidiEvent(120, 2, 60, 0)],
      ])
    })
  })
})
