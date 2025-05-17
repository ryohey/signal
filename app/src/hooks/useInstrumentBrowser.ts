import { difference, range } from "lodash"
import { useCallback, useMemo } from "react"
import { useSetTrackInstrument } from "../actions"
import { isNotUndefined } from "../helpers/array"
import { getCategoryIndex } from "../midi/GM"
import { programChangeMidiEvent } from "../midi/MidiEvent"
import { usePianoRoll } from "./usePianoRoll"
import { usePlayer } from "./usePlayer"
import { usePreviewNote } from "./usePreviewNote"
import { useSong } from "./useSong"
import { useTrack } from "./useTrack"

export function useInstrumentBrowser() {
  const {
    selectedTrackId,
    instrumentBrowserSetting: setting,
    setInstrumentBrowserSetting: setSetting,
    setOpenInstrumentBrowser: setOpen,
  } = usePianoRoll()
  const { isRhythmTrack, channel, setChannel } = useTrack(selectedTrackId)
  const { isPlaying, sendEvent } = usePlayer()
  const setTrackInstrumentAction = useSetTrackInstrument(selectedTrackId)
  const { tracks } = useSong()
  const { previewNoteOn } = usePreviewNote()

  const onClickOK = useCallback(() => {
    if (setting.isRhythmTrack) {
      setChannel(9)
      setTrackInstrumentAction(0)
    } else {
      if (isRhythmTrack) {
        // 適当なチャンネルに変える
        const channels = range(16)
        const usedChannels = tracks
          .filter((t) => t.id !== selectedTrackId)
          .map((t) => t.channel)
        const availableChannel =
          Math.min(
            ...difference(channels, usedChannels).filter(isNotUndefined),
          ) || 0
        setChannel(availableChannel)
      }
      setTrackInstrumentAction(setting.programNumber)
    }

    setOpen(false)
  }, [
    setting,
    setSetting,
    selectedTrackId,
    setChannel,
    isRhythmTrack,
    tracks,
    setOpen,
    setTrackInstrumentAction,
  ])

  const selectedCategoryIndex = getCategoryIndex(setting.programNumber)

  return {
    setting,
    setSetting,
    get isOpen() {
      return usePianoRoll().openInstrumentBrowser
    },
    setOpen,
    selectedCategoryIndex,
    get categoryFirstProgramEvents() {
      return useMemo(() => {
        return range(0, 127, 8)
      }, [])
    },
    get categoryInstruments() {
      return useMemo(() => {
        const offset = selectedCategoryIndex * 8
        return range(offset, offset + 8)
      }, [selectedCategoryIndex])
    },
    onChangeInstrument: useCallback(
      (programNumber: number) => {
        if (channel === undefined) {
          return
        }
        sendEvent(programChangeMidiEvent(0, channel, programNumber))
        if (!isPlaying) {
          previewNoteOn(64, 500)
        }
        setSetting({
          programNumber,
          isRhythmTrack: setting.isRhythmTrack,
        })
      },
      [setSetting, setting, channel, previewNoteOn],
    ),
    onClickOK,
  }
}
