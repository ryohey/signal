import { Measure, noteOffMidiEvent, noteOnMidiEvent } from "@signal-app/core"
import { useCallback } from "react"
import { usePianoRoll, usePianoRollTickScroll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import { useStores } from "../hooks/useStores"
import { useTrackMute } from "../hooks/useTrackMute"
import { useToggleGhostTrack } from "./track"

export const useStop = () => {
  const { setScrollLeftInTicks } = usePianoRollTickScroll()
  const { stop, setPosition } = usePlayer()

  return useCallback(() => {
    stop()
    setPosition(0)
    setScrollLeftInTicks(0)
  }, [stop, setPosition, setScrollLeftInTicks])
}

export const useRewindOneBar = () => {
  const { measures, timebase } = useSong()
  const { scrollLeftTicks, setScrollLeftInTicks } = usePianoRollTickScroll()
  const { position, setPosition } = usePlayer()

  // Cache the callback to avoid getSnapshot warnings
  return useCallback(() => {
    const tick = Measure.getPreviousMeasureTick(measures, position, timebase)
    setPosition(tick)

    // make sure player doesn't move out of sight to the left
    if (position < scrollLeftTicks) {
      setScrollLeftInTicks(position)
    }
  }, [
    measures,
    timebase,
    position,
    scrollLeftTicks,
    setPosition,
    setScrollLeftInTicks,
  ])
}

export const useFastForwardOneBar = () => {
  const { transform, scrollLeft, canvasWidth, setScrollLeftInPixels } =
    usePianoRollTickScroll()
  const { measures, timebase } = useSong()
  const { position, setPosition } = usePlayer()

  return useCallback(() => {
    const tick = Measure.getNextMeasureTick(measures, position, timebase)
    setPosition(tick)

    // make sure player doesn't move out of sight to the right
    const x = transform.getX(position)
    const screenX = x - scrollLeft
    if (screenX > canvasWidth * 0.7) {
      setScrollLeftInPixels(x - canvasWidth * 0.7)
    }
  }, [
    measures,
    timebase,
    position,
    transform,
    scrollLeft,
    canvasWidth,
    setPosition,
    setScrollLeftInPixels,
  ])
}

export const useNextTrack = () => {
  const { selectedTrackIndex, setSelectedTrackIndex } = usePianoRoll()
  const { tracks } = useSong()

  return useCallback(() => {
    setSelectedTrackIndex(Math.min(selectedTrackIndex + 1, tracks.length - 1))
  }, [selectedTrackIndex, setSelectedTrackIndex, tracks.length])
}

export const usePreviousTrack = () => {
  const { selectedTrackIndex, setSelectedTrackIndex } = usePianoRoll()

  return useCallback(() => {
    setSelectedTrackIndex(Math.max(selectedTrackIndex - 1, 1))
  }, [selectedTrackIndex, setSelectedTrackIndex])
}

export const useToggleSolo = () => {
  const { toggleSolo } = useTrackMute()
  const { selectedTrackId } = usePianoRoll()

  return useCallback(
    () => toggleSolo(selectedTrackId),
    [toggleSolo, selectedTrackId],
  )
}

export const useToggleMute = () => {
  const { toggleMute } = useTrackMute()
  const { selectedTrackId } = usePianoRoll()

  return useCallback(
    () => toggleMute(selectedTrackId),
    [toggleMute, selectedTrackId],
  )
}

export const useToggleGhost = () => {
  const { selectedTrackId } = usePianoRoll()
  const toggleGhostTrack = useToggleGhostTrack()

  return useCallback(
    () => toggleGhostTrack(selectedTrackId),
    [toggleGhostTrack, selectedTrackId],
  )
}

export const useStartNote = () => {
  const { synthGroup } = useStores()
  const { sendEvent } = usePlayer()

  return useCallback(
    (
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
      sendEvent(noteOnMidiEvent(0, channel, noteNumber, velocity), delayTime)
    },
    [synthGroup, sendEvent],
  )
}

export const useStopNote = () => {
  const { sendEvent } = usePlayer()

  return useCallback(
    (
      {
        channel,
        noteNumber,
      }: {
        noteNumber: number
        channel: number
      },
      delayTime = 0,
    ) => {
      sendEvent(noteOffMidiEvent(0, channel, noteNumber, 0), delayTime)
    },
    [sendEvent],
  )
}
