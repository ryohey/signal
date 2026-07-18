import { useCallback } from "react"
import { usePlayer } from "./usePlayer"
import { useStores } from "./useStores"

export const useToggleRecording = () => {
  const { midiRecorder } = useStores()
  const { play, stop } = usePlayer()

  return useCallback(() => {
    if (midiRecorder.isRecording) {
      midiRecorder.stop()
      stop()
    } else {
      midiRecorder.start()
      play()
    }
  }, [midiRecorder, play, stop])
}
