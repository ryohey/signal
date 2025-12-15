import { TrackId } from "@signal-app/core"

/**

  Two modes are switched by user operations

  ## Mute Mode

  Simply mute/unmute to turn track output OFF/ON
  Mute settings are maintained independently from solo

  ## Solo Mode

  Transitions to this mode when any track is soloed
  Mutes all tracks except the specified one, but
  when additionally soloing other tracks,
  unmutes those tracks (independent from mute mode settings)

  Transitions back to mute mode when
  all tracks' solo states are cleared

*/
export interface TrackMute {
  readonly mutes: { [trackId: TrackId]: boolean }
  readonly solos: { [trackId: TrackId]: boolean }
}

export namespace TrackMute {
  export const empty: TrackMute = {
    mutes: {},
    solos: {},
  }

  const setMute =
    (trackId: TrackId, isMute: boolean) =>
    (trackMute: TrackMute): TrackMute => {
      if (isSoloMode(trackMute)) {
        return trackMute // do nothing
      }
      return {
        ...trackMute,
        mutes: {
          ...trackMute.mutes,
          [trackId]: isMute,
        },
      }
    }

  const getMute = (trackId: TrackId) => (trackMute: TrackMute) => {
    return trackMute.mutes[trackId] || false
  }

  const setSolo =
    (trackId: TrackId, isSolo: boolean) =>
    (trackMute: TrackMute): TrackMute => {
      return {
        ...trackMute,
        solos: {
          ...trackMute.solos,
          [trackId]: isSolo,
        },
      }
    }

  const getSolo = (trackId: TrackId) => (trackMute: TrackMute) => {
    return trackMute.solos[trackId] || false
  }

  export function isSoloMode(trackMute: TrackMute): boolean {
    // If any track is solo, it's solo mode
    return Object.values(trackMute.solos).some((s) => s)
  }

  export const isSolo = (trackId: TrackId) => (trackMute: TrackMute) => {
    return isSoloMode(trackMute) && trackMute.solos[trackId]
  }

  export const isMuted = (trackId: TrackId) => (trackMute: TrackMute) => {
    return !shouldPlayTrack(trackId)(trackMute)
  }

  export const mute = (trackId: TrackId) => setMute(trackId, true)

  export const unmute = (trackId: TrackId) => setMute(trackId, false)

  export const solo = (trackId: TrackId) => setSolo(trackId, true)

  export const unsolo = (trackId: TrackId) => setSolo(trackId, false)

  export const shouldPlayTrack =
    (trackId: TrackId) => (trackMute: TrackMute) => {
      if (isSoloMode(trackMute)) {
        return getSolo(trackId)(trackMute)
      } else {
        return !getMute(trackId)(trackMute)
      }
    }
}
