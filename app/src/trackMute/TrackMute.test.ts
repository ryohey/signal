import { TrackId } from "../track/Track"
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
    expect(TrackMute.isMuted(t, getTrackId(getTrackId(0)))).toBeFalsy()
    expect(TrackMute.isMuted(t, getTrackId(100))).toBeFalsy()
  })

  it("mute", () => {
    let t: TrackMute = {
      mutes: {},
      solos: {},
    }
    expect(TrackMute.isMuted(t, getTrackId(getTrackId(0)))).toBeFalsy()
    t = TrackMute.mute(t, getTrackId(getTrackId(0)))
    expect(TrackMute.isMuted(t, getTrackId(getTrackId(0)))).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(t, getTrackId(getTrackId(0)))).toBeFalsy()
    t = TrackMute.unmute(t, getTrackId(getTrackId(0)))
    expect(TrackMute.isMuted(t, getTrackId(getTrackId(0)))).toBeFalsy()
  })

  it("solo", () => {
    let t: TrackMute = {
      mutes: {},
      solos: {},
    }
    expect(TrackMute.isSolo(t, getTrackId(getTrackId(0)))).toBeFalsy()
    t = TrackMute.solo(t, getTrackId(0))
    expect(TrackMute.isSolo(t, getTrackId(0))).toBeTruthy()
    expect(TrackMute.isSoloMode(t)).toBeTruthy()
    expect(TrackMute.isMuted(t, getTrackId(1))).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(t, getTrackId(0))).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(t, getTrackId(1))).toBeFalsy()
    t = TrackMute.solo(t, getTrackId(1))
    expect(TrackMute.isSolo(t, getTrackId(0))).toBeTruthy()
    expect(TrackMute.isSolo(t, getTrackId(1))).toBeTruthy()
    expect(TrackMute.isSoloMode(t)).toBeTruthy()
    expect(TrackMute.isMuted(t, getTrackId(0))).toBeFalsy()
    expect(TrackMute.isMuted(t, getTrackId(1))).toBeFalsy()
    expect(TrackMute.isMuted(t, getTrackId(2))).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(t, getTrackId(0))).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(t, getTrackId(1))).toBeTruthy()
    expect(TrackMute.shouldPlayTrack(t, getTrackId(2))).toBeFalsy()
    t = TrackMute.unsolo(t, getTrackId(0))
    expect(TrackMute.isSolo(t, getTrackId(0))).toBeFalsy()
    expect(TrackMute.isSoloMode(t)).toBeTruthy()
    t = TrackMute.unsolo(t, getTrackId(1))
    expect(TrackMute.isSolo(t, getTrackId(1))).toBeFalsy()
    expect(TrackMute.isSoloMode(t)).toBeFalsy()
  })
})
