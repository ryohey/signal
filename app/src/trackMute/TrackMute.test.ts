import { TrackId } from "@signal-app/core"
import { TrackMute } from "./TrackMute"

function getTrackId(value: number): TrackId {
  return value as TrackId
}

describe("TrackMute", () => {
  it("not muted by default", () => {
    const t: TrackMute = {
      mutes: {},
      solos: {},
    }
    expect(TrackMute.isMuted(getTrackId(0))(t)).toBeFalsy()
    expect(TrackMute.isMuted(getTrackId(100))(t)).toBeFalsy()
  })

  it("mute", () => {
    let t: TrackMute = {
      mutes: {},
      solos: {},
    }
    expect(TrackMute.isMuted(getTrackId(0))(t)).toBeFalsy()
    t = TrackMute.mute(getTrackId(0))(t)
    expect(TrackMute.isMuted(getTrackId(0))(t)).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(getTrackId(0))(t)).toBeFalsy()
    t = TrackMute.unmute(getTrackId(0))(t)
    expect(TrackMute.isMuted(getTrackId(0))(t)).toBeFalsy()
  })

  it("solo", () => {
    let t: TrackMute = {
      mutes: {},
      solos: {},
    }
    expect(TrackMute.isSolo(getTrackId(0))(t)).toBeFalsy()
    t = TrackMute.solo(getTrackId(0))(t)
    expect(TrackMute.isSolo(getTrackId(0))(t)).toBeTruthy()
    expect(TrackMute.isSoloMode(t)).toBeTruthy()
    expect(TrackMute.isMuted(getTrackId(1))(t)).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(getTrackId(0))(t)).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(getTrackId(1))(t)).toBeFalsy()
    t = TrackMute.solo(getTrackId(1))(t)
    expect(TrackMute.isSolo(getTrackId(0))(t)).toBeTruthy()
    expect(TrackMute.isSolo(getTrackId(1))(t)).toBeTruthy()
    expect(TrackMute.isSoloMode(t)).toBeTruthy()
    expect(TrackMute.isMuted(getTrackId(0))(t)).toBeFalsy()
    expect(TrackMute.isMuted(getTrackId(1))(t)).toBeFalsy()
    expect(TrackMute.isMuted(getTrackId(2))(t)).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(getTrackId(0))(t)).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(getTrackId(1))(t)).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(getTrackId(2))(t)).toBeFalsy()
    t = TrackMute.unsolo(getTrackId(0))(t)
    expect(TrackMute.isSolo(getTrackId(0))(t)).toBeFalsy()
    expect(TrackMute.isSoloMode(t)).toBeTruthy()
    t = TrackMute.unsolo(getTrackId(1))(t)
    expect(TrackMute.isSolo(getTrackId(1))(t)).toBeFalsy()
    expect(TrackMute.isSoloMode(t)).toBeFalsy()
  })
})
