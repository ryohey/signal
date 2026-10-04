import { switchSubscription } from "@signal-app/observable"
import type RootStore from "./RootStore"

export const registerReactions = ({
  songStore,
  player,
  midiRecorder,
  autoSaveService,
}: RootStore) => {
  // disable seeking while recording
  midiRecorder.onIsRecordingChanged.subscribe(() => {
    player.disableSeek = midiRecorder.isRecording
  })

  // stop recording when stop player
  player.onIsPlayingChanged.subscribe(() => {
    if (!player.isPlaying) {
      midiRecorder.stop()
    }
  })

  // Watch for song changes and set the auto-save flag
  switchSubscription(
    songStore.onSongChanged.subscribe,
    () => songStore.song.onIsSavedChanged.subscribe,
  )(() => {
    if (!songStore.song.isSaved) {
      autoSaveService.onSongChanged()
    }
  })
}
