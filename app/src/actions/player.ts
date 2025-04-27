import { Measure } from "../entities/measure/Measure"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import { useStores } from "../hooks/useStores"
import { noteOffMidiEvent, noteOnMidiEvent } from "../midi/MidiEvent"

export const useStop = () => {
  const { pianoRollStore } = useStores()
  const { stop, setPosition } = usePlayer()

  return () => {
    stop()
    setPosition(0)
    pianoRollStore.setScrollLeftInTicks(0)
  }
}

export const useRewindOneBar = () => {
  const { pianoRollStore } = useStores()
  const song = useSong()
  const { position, setPosition } = usePlayer()

  return () => {
    const tick = Measure.getPreviousMeasureTick(
      song.measures,
      position,
      song.timebase,
    )
    setPosition(tick)

    // make sure player doesn't move out of sight to the left
    if (position < pianoRollStore.scrollLeftTicks) {
      pianoRollStore.setScrollLeftInTicks(position)
    }
  }
}

export const useFastForwardOneBar = () => {
  const { pianoRollStore } = useStores()
  const song = useSong()
  const { position, setPosition } = usePlayer()

  return () => {
    const tick = Measure.getNextMeasureTick(
      song.measures,
      position,
      song.timebase,
    )
    setPosition(tick)

    // make sure player doesn't move out of sight to the right
    const { transform, scrollLeft } = pianoRollStore
    const x = transform.getX(position)
    const screenX = x - scrollLeft
    if (screenX > pianoRollStore.canvasWidth * 0.7) {
      pianoRollStore.setScrollLeftInPixels(x - pianoRollStore.canvasWidth * 0.7)
    }
  }
}

export const useNextTrack = () => {
  const { pianoRollStore } = useStores()
  const song = useSong()

  return () => {
    pianoRollStore.selectedTrackIndex = Math.min(
      pianoRollStore.selectedTrackIndex + 1,
      song.tracks.length - 1,
    )
  }
}

export const usePreviousTrack = () => {
  const { pianoRollStore } = useStores()
  return () => {
    pianoRollStore.selectedTrackIndex = Math.max(
      pianoRollStore.selectedTrackIndex - 1,
      1,
    )
  }
}

export const useToggleSolo = () => {
  const {
    pianoRollStore: { selectedTrackId },
    trackMute,
  } = useStores()
  return () => {
    if (trackMute.isSolo(selectedTrackId)) {
      trackMute.unsolo(selectedTrackId)
    } else {
      trackMute.solo(selectedTrackId)
    }
  }
}

export const useToggleMute = () => {
  const {
    pianoRollStore: { selectedTrackId },
    trackMute,
  } = useStores()
  return () => {
    if (trackMute.isMuted(selectedTrackId)) {
      trackMute.unmute(selectedTrackId)
    } else {
      trackMute.mute(selectedTrackId)
    }
  }
}

export const useToggleGhost = () => {
  const {
    pianoRollStore: { selectedTrackId },
    pianoRollStore,
  } = useStores()

  return () => {
    if (pianoRollStore.notGhostTrackIds.has(selectedTrackId)) {
      pianoRollStore.notGhostTrackIds.delete(selectedTrackId)
    } else {
      pianoRollStore.notGhostTrackIds.add(selectedTrackId)
    }
  }
}

export const useStartNote = () => {
  const { synthGroup } = useStores()
  const { sendEvent } = usePlayer()

  return (
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
  }
}

export const useStopNote = () => {
  const { sendEvent } = usePlayer()

  return (
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
  }
}
