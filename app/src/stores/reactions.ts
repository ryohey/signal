import { autorun, observe } from "mobx"
import MIDIOutput from "../services/MIDIOutput"
import RootStore from "./RootStore"

export const registerReactions = (rootStore: RootStore) => {
  observe(
    rootStore.midiDeviceStore,
    "enabledOutputs",
    updateOutputDevices(rootStore),
  )

  autorun(updateOutputDevices(rootStore))

  observe(
    rootStore.midiRecorder,
    "isRecording",
    disableSeekWhileRecording(rootStore),
  )

  observe(rootStore.player, "isPlaying", stopRecordingWhenStopPlayer(rootStore))
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

const disableSeekWhileRecording: Reaction =
  ({ player, midiRecorder }) =>
  () =>
    (player.disableSeek = midiRecorder.isRecording)

const stopRecordingWhenStopPlayer: Reaction =
  ({ player, midiRecorder }) =>
  () => {
    if (!player.isPlaying) {
      midiRecorder.isRecording = false
    }
  }
