import { useCallback } from "react"
import {
  useFastForwardOneBar,
  useRewindOneBar,
  useStop,
  useToggleRecording,
} from "../actions"
import { Measure } from "../entities/measure/Measure"
import { useCanRecord } from "./useMIDIDevice"
import { useMobxGetter, useMobxSelector } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { useStores } from "./useStores"

export function useTransportPanel() {
  const { songStore, player, synthGroup, midiRecorder } = useStores()
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
    get currentMBTTime() {
      return useMobxSelector(
        () =>
          Measure.getMBTString(
            songStore.song.measures,
            player.position,
            songStore.song.timebase,
          ),
        [songStore, player],
      )
    },
  }
}
