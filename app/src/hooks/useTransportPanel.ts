import { useCallback } from "react"
import {
  useFastForwardOneBar,
  useRewindOneBar,
  useStop,
  useToggleRecording,
} from "../actions"
import { useCanRecord } from "./useMIDIDevice"
import { useMobxGetter } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { useStores } from "./useStores"

export function useTransportPanel() {
  const { synthGroup, midiRecorder } = useStores()
  const canRecording = useCanRecord()
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
    canRecording,
    get isRecording() {
      return useMobxGetter(midiRecorder, "isRecording")
    },
    get isMetronomeEnabled() {
      return useMobxGetter(synthGroup, "isMetronomeEnabled")
    },
  }
}
