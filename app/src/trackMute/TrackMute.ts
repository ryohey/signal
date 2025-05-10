import { TrackId } from "../track/Track"

/**

  操作によって二つのモードが切り替わる

  ## mute モード

  単に mute/unmute でトラックの出力を OFF/ON にする
  solo とは独立してミュート設定を保持する

  ## solo モード

  何かのトラックを solo にした時にこのモードに遷移する
  指定トラック以外の全てのトラックを mute するが、
  追加で他のトラックを solo にしたときは
  そのトラックの mute を解除する (mute モードのミュート設定とは独立)

  すべてのトラックの solo が解除された時に
  mute モードに遷移する

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

  function setMute(
    trackMute: TrackMute,
    trackId: TrackId,
    isMute: boolean,
  ): TrackMute {
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

  function getMute(trackMute: TrackMute, trackId: TrackId) {
    return trackMute.mutes[trackId] || false
  }

  function setSolo(
    trackMute: TrackMute,
    trackId: TrackId,
    isSolo: boolean,
  ): TrackMute {
    return {
      ...trackMute,
      solos: {
        ...trackMute.solos,
        [trackId]: isSolo,
      },
    }
  }

  function getSolo(trackMute: TrackMute, trackId: TrackId) {
    return trackMute.solos[trackId] || false
  }

  export function isSoloMode(trackMute: TrackMute): boolean {
    // どれかひとつでも solo なら solo モード
    // Any one or Solo mode Solo mode
    return Object.values(trackMute.solos).some((s) => s)
  }

  export function isSolo(trackMute: TrackMute, trackId: TrackId) {
    return isSoloMode(trackMute) && trackMute.solos[trackId]
  }

  export function isMuted(trackMute: TrackMute, trackId: TrackId) {
    return !shouldPlayTrack(trackMute, trackId)
  }

  export function mute(trackMute: TrackMute, trackId: TrackId): TrackMute {
    return setMute(trackMute, trackId, true)
  }

  export function unmute(trackMute: TrackMute, trackId: TrackId): TrackMute {
    return setMute(trackMute, trackId, false)
  }

  export function solo(trackMute: TrackMute, trackId: TrackId): TrackMute {
    return setSolo(trackMute, trackId, true)
  }

  export function unsolo(trackMute: TrackMute, trackId: TrackId): TrackMute {
    return setSolo(trackMute, trackId, false)
  }

  export function shouldPlayTrack(trackMute: TrackMute, trackId: TrackId) {
    if (isSoloMode(trackMute)) {
      return getSolo(trackMute, trackId)
    } else {
      return !getMute(trackMute, trackId)
    }
  }
}
