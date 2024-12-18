import { Measure } from "../entities/measure/Measure"
import { useStores } from "../hooks/useStores"
import { noteOffMidiEvent, noteOnMidiEvent } from "../midi/MidiEvent"
import RootStore from "../stores/RootStore"

export const playOrPause =
  ({ player }: RootStore) =>
  () => {
    if (player.isPlaying) {
      player.stop()
    } else {
      player.play()
    }
  }

export const stop =
  ({ player, pianoRollStore }: RootStore) =>
  () => {
    player.stop()
    player.position = 0
    pianoRollStore.setScrollLeftInTicks(0)
  }

export const rewindOneBar =
  ({ song, player, pianoRollStore }: RootStore) =>
  () => {
    const tick = Measure.getPreviousMeasureTick(
      song.measures,
      player.position,
      song.timebase,
    )
    player.position = tick

    // make sure player doesn't move out of sight to the left
    if (player.position < pianoRollStore.scrollLeftTicks) {
      pianoRollStore.setScrollLeftInTicks(player.position)
    }
  }

export const fastForwardOneBar =
  ({ song, player, pianoRollStore }: RootStore) =>
  () => {
    const tick = Measure.getNextMeasureTick(
      song.measures,
      player.position,
      song.timebase,
    )
    player.position = tick

    // make sure player doesn't move out of sight to the right
    const { transform, scrollLeft } = pianoRollStore
    const x = transform.getX(player.position)
    const screenX = x - scrollLeft
    if (screenX > pianoRollStore.canvasWidth * 0.7) {
      pianoRollStore.setScrollLeftInPixels(x - pianoRollStore.canvasWidth * 0.7)
    }
  }

export const nextTrack =
  ({ pianoRollStore, song }: RootStore) =>
  () => {
    pianoRollStore.selectedTrackIndex = Math.min(
      pianoRollStore.selectedTrackIndex + 1,
      song.tracks.length - 1,
    )
  }

export const previousTrack =
  ({ pianoRollStore }: RootStore) =>
  () => {
    pianoRollStore.selectedTrackIndex = Math.max(
      pianoRollStore.selectedTrackIndex - 1,
      1,
    )
  }

export const toggleSolo =
  ({ pianoRollStore: { selectedTrackId }, trackMute }: RootStore) =>
  () => {
    if (trackMute.isSolo(selectedTrackId)) {
      trackMute.unsolo(selectedTrackId)
    } else {
      trackMute.solo(selectedTrackId)
    }
  }

export const toggleMute =
  ({ pianoRollStore: { selectedTrackId }, trackMute }: RootStore) =>
  () => {
    if (trackMute.isMuted(selectedTrackId)) {
      trackMute.unmute(selectedTrackId)
    } else {
      trackMute.mute(selectedTrackId)
    }
  }

export const toggleGhost =
  ({ pianoRollStore: { selectedTrackId }, pianoRollStore }: RootStore) =>
  () => {
    if (pianoRollStore.notGhostTrackIds.has(selectedTrackId)) {
      pianoRollStore.notGhostTrackIds.delete(selectedTrackId)
    } else {
      pianoRollStore.notGhostTrackIds.add(selectedTrackId)
    }
  }

export const setLoopBegin =
  ({ player }: RootStore) =>
  (tick: number) => {
    player.loop = {
      end: Math.max(tick, player.loop?.end ?? tick),
      enabled: player.loop?.enabled ?? false,
      begin: tick,
    }
  }

export const setLoopEnd =
  ({ player }: RootStore) =>
  (tick: number) => {
    player.loop = {
      begin: Math.min(tick, player.loop?.begin ?? tick),
      enabled: player.loop?.enabled ?? false,
      end: tick,
    }
  }

export const toggleEnableLoop =
  ({ player }: RootStore) =>
  () => {
    if (player.loop === null) {
      return
    }
    player.loop = { ...player.loop, enabled: !player.loop.enabled }
  }

export const useStartNote = () => {
  const { player, synthGroup } = useStores()
  return (
    {
      channel,
      noteNumber,
      velocity,
    }: {
      noteNumber: number
      velocity: number
      channel: number
    },
    delayTime = 0,
  ) => {
    synthGroup.activate()
    player.sendEvent(
      noteOnMidiEvent(0, channel, noteNumber, velocity),
      delayTime,
    )
  }
}

export const useStopNote = () => {
  const { player } = useStores()
  return (
    {
      channel,
      noteNumber,
    }: {
      noteNumber: number
      channel: number
    },
    delayTime = 0,
  ) => {
    player.sendEvent(noteOffMidiEvent(0, channel, noteNumber, 0), delayTime)
  }
}
