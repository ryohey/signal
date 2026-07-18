import { Measure } from "@signal-app/core"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import {
  useFastForwardOneBar,
  useRewindOneBar,
  useStop,
} from "../../../actions"
import { usePlayer } from "../../../hooks/usePlayer"
import { useSong } from "../../../hooks/useSong"
import { useStores } from "../../../hooks/useStores"
import { useToggleRecording } from "../../../hooks/useToggleRecording"
import { useCanRecord } from "../../midi-device/hooks/useMIDIDevice"

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
      synthGroup.setIsMetronomeEnabled(!synthGroup.isMetronomeEnabled)
    }, [synthGroup]),
    isPlaying,
    isLoopEnabled: loop !== null,
    isLoopActive: loop?.enabled ?? false,
    canRecording,
    get isRecording() {
      return useSyncExternalStore(
        midiRecorder.onIsRecordingChanged.subscribe,
        useCallback(() => midiRecorder.isRecording, [midiRecorder]),
      )
    },
    get isMetronomeEnabled() {
      return useSyncExternalStore(
        synthGroup.onIsMetronomeEnabledChanged.subscribe,
        useCallback(() => synthGroup.isMetronomeEnabled, [synthGroup]),
      )
    },
    get currentMBTTime() {
      const { measures, timebase } = useSong()
      const { position } = usePlayer()

      return useMemo(
        () => Measure.getMBTString(measures, position, timebase),
        [measures, timebase, position],
      )
    },
  }
}
