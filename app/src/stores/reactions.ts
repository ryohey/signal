import { autorun, observe, reaction } from "mobx"
import MIDIOutput from "../services/MIDIOutput"
import type RootStore from "./RootStore"

export const registerReactions = (rootStore: RootStore) => {
  observe(
    rootStore.midiDeviceStore,
    "enabledOutputs",
    updateOutputDevices(rootStore)
  )

  autorun(updateInputDevices(rootStore))
  autorun(updateOutputDevices(rootStore))

  observe(
    rootStore.midiRecorder,
    "isRecording",
    disableSeekWhileRecording(rootStore)
  )

  observe(rootStore.player, "isPlaying", stopRecordingWhenStopPlayer(rootStore))

  // Watch for song changes and set the auto-save flag
  reaction(
    () => rootStore.songStore.song.isSaved,
    (isSaved) => {
      if (!isSaved) {
        rootStore.autoSaveService.onSongChanged()
      }
    }
  )
}

type Reaction = (rootStore: RootStore) => () => void

// sync synthGroup.output to enabledOutputIds/isFactorySoundEnabled
const updateOutputDevices: Reaction =
  ({ midiDeviceStore, player, synth, synthGroup }) =>
  () => {
    const { outputs, enabledOutputs, isFactorySoundEnabled } = midiDeviceStore

    player.allSoundsOff()

    const midiDeviceEntries = outputs.map((device) => ({
      synth: new MIDIOutput(device),
      isEnabled: enabledOutputs[device.id],
    }))

    synthGroup.outputs = [
      {
        synth: synth,
        isEnabled: isFactorySoundEnabled,
      },
      ...midiDeviceEntries,
    ]
  }

const updateInputDevices: Reaction =
  ({ midiDeviceStore, midiInput }) =>
  () => {
    const { inputs, enabledInputs } = midiDeviceStore

    const devices = inputs.filter((d) => enabledInputs[d.id])

    midiInput.removeAllDevices()
    devices.forEach(midiInput.addDevice)
  }

const disableSeekWhileRecording: Reaction =
  ({ player, midiRecorder }) =>
  () => {
    player.disableSeek = midiRecorder.isRecording
  }

const stopRecordingWhenStopPlayer: Reaction =
  ({ player, midiRecorder }) =>
  () => {
    if (!player.isPlaying) {
      midiRecorder.isRecording = false
    }
  }
