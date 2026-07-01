import * as fs from "fs"
import * as path from "path"
import { describe, expect, it, vi } from "vitest"
import { songFromMidi, songToMidi, timeSignatureMidiEvent } from "../../midi"
import { toTrackEvents } from "../../midi/toTrackEvents"
import { emptyTrack } from "../track"
import {
  getPan,
  getProgramNumberEvent,
  getTempo,
  getVolume,
} from "../track/selector"
import { Song } from "./Song"
import { emptySong } from "./SongFactory"

describe("Song", () => {
  const song = songFromMidi(
    new DataView(
      fs.readFileSync(path.join(__dirname, "../../../testdata/tracks.mid"))
        .buffer,
    ),
  )

  it("fromMidi", () => {
    expect(song).not.toBeNull()
    const { tracks } = song
    expect(tracks.length).toBe(18)

    expect(tracks[0].isConductorTrack).toBeTruthy()
    expect(!tracks[1].isConductorTrack).toBeTruthy()
    expect(tracks[1].channel).toBe(0)
    expect(tracks[2].channel).toBe(0)
    expect(tracks[3].channel).toBe(1)
    expect(tracks[17].channel).toBe(15)

    expect(getTempo(tracks[0].events, 240)).toBe(128)
    expect(getVolume(tracks[2].events, 193)).toBe(100)
    expect(getPan(tracks[2].events, 192)).toBe(1)
    expect(getProgramNumberEvent(tracks[2].events, 189)?.value).toBe(29)
  })

  it("should be serializable", () => {
    const song = emptySong()
    song.filepath = "abc"
    const x = song.serialize()
    const s = Song.deserialize(x)
    expect(s.filepath).toBe("abc")
    expect(s.tracks.length).toBe(song.tracks.length)
  })

  it("should deserialize from its own serialized POJO", () => {
    const song = emptySong()
    song.filepath = "abc"
    song.name = "test"

    const restored = Song.deserialize(song.serialize())

    expect(restored.serialize()).toStrictEqual(song.serialize())
  })

  it("should serialize to a POJO", () => {
    const song = emptySong()
    song.filepath = "abc"
    song.name = "test"

    const serialized = song.serialize()

    expect(serialized).toMatchObject({
      tracks: song.tracks.map((track) => track.serialize()),
      name: "test",
      filepath: "abc",
      timebase: song.timebase,
      isSaved: song.isSaved,
    })
    expect(serialized.lastTrackId).toBeGreaterThanOrEqual(song.tracks.length)
  })

  it("should use Track.serialize when serializing song", () => {
    const song = emptySong()
    const spy = vi.spyOn(song.tracks[0], "serialize")

    song.serialize()

    expect(spy).toHaveBeenCalled()
  })

  it("should assign id to track", () => {
    const song = emptySong()
    song.addTrack(emptyTrack(0))
    song.addTrack(emptyTrack(2))
    song.addTrack(emptyTrack(4))
    expect(song.tracks[0].id).toBe(0)
    expect(song.tracks[1].id).toBe(1)
    expect(song.tracks[2].id).toBe(2)
    song.removeTrack(song.tracks[1].id)
    song.addTrack(emptyTrack(8))
    expect(song.tracks[2].id).toBe(3)
  })

  it("should restore measures when opening midi", () => {
    const song = emptySong()
    song.timebase = 960
    song.conductorTrack?.addEvents(
      toTrackEvents([timeSignatureMidiEvent(3840, 3, 4)]),
    )

    const reopenedSong = songFromMidi(songToMidi(song))

    expect(reopenedSong.measures).toStrictEqual([
      {
        tick: 0,
        measure: 0,
        numerator: 4,
        denominator: 4,
      },
      {
        tick: 3840,
        measure: 1,
        numerator: 3,
        denominator: 4,
      },
    ])
  })

  it("should notify endOfSong changes when track endOfTrack changes", () => {
    const song = emptySong()
    const notifications: number[] = []

    song.onEndOfSongChanged.subscribe(() => {
      notifications.push(song.endOfSong)
    })

    song.tracks[1].addEvents(
      toTrackEvents([
        {
          type: "channel",
          subtype: "noteOn",
          channel: 0,
          noteNumber: 60,
          velocity: 100,
          deltaTime: 0,
        },
        {
          type: "channel",
          subtype: "noteOff",
          channel: 0,
          noteNumber: 60,
          velocity: 0,
          deltaTime: 960,
        },
      ]),
    )

    expect(notifications.length).toBeGreaterThan(0)
  })
})
