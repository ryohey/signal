import { Measure } from "@signal-app/core"
import { useCallback } from "react"
import {
  useFastForwardOneBar,
  useRewindOneBar,
  useStop,
  useToggleRecording,
} from "../actions"
import { useCanRecord } from "./useMIDIDevice"
import { useMobxGetter, useMobxSelector } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { useStores } from "./useStores"

export function useTransportPanel() {
  const { songStore, player, synthGroup, midiRecorder } = useStores()
  const canRecording = useCanRecord()
  const { isPlaying, loop, playOrPause, toggleEnableLoop } = usePlayer()

  // Call hooks at the top level, not inside getters
  const isRecording = useMobxGetter(midiRecorder, "isRecording")
  const isMetronomeEnabled = useMobxGetter(synthGroup, "isMetronomeEnabled")
  const currentMBTTime = useMobxSelector(
    () =>
      Measure.getMBTString(
        songStore.song.measures,
        player.position,
        songStore.song.timebase,
      ),
    [songStore, player],
  )

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
    isRecording,
    isMetronomeEnabled,
    currentMBTTime,
  }
}
