import { useCallback } from "react"
import {
  useFastForwardOneBar,
  useRewindOneBar,
  useStop,
  useToggleRecording,
} from "../actions"
import { useMIDIDevice } from "./useMIDIDevice"
import { useMobxStore } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { useStores } from "./useStores"

export function useTransportPanel() {
  const { synthGroup } = useStores()
  const { enabledInputs } = useMIDIDevice()
  const { isPlaying, loop, playOrPause, toggleEnableLoop } = usePlayer()

  return {
    play: playOrPause,
    stop: useStop(),
    rewindOneBar: useRewindOneBar(),
    fastForwardOneBar: useFastForwardOneBar(),
    toggleRecording: useToggleRecording(),
    toggleEnableLoop,
    toggleMetronome: useCallback(() => {
      synthGroup.isMetronomeEnabled = !synthGroup.isMetronomeEnabled
    }, [synthGroup]),
    isPlaying,
    isLoopEnabled: loop !== null,
    isLoopActive: loop?.enabled ?? false,
    canRecording: Object.values(enabledInputs).filter((e) => e).length > 0,
    get isRecording() {
      return useMobxStore(({ midiRecorder }) => midiRecorder.isRecording)
    },
    get isMetronomeEnabled() {
      return useMobxStore(({ synthGroup }) => synthGroup.isMetronomeEnabled)
    },
  }
}
